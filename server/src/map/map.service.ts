import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RouteResult {
  /** Route geometry as [lat, lng] pairs (converted from OSRM's [lng, lat]) */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

interface CacheEntry {
  result: RouteResult;
  expiresAt: number;
}

interface OsrmResponse {
  code?: string;
  routes?: Array<{
    geometry?: { coordinates?: [number, number][] };
    distance?: number;
    duration?: number;
  }>;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // road routes barely change day to day
const MAX_CACHE_ENTRIES = 500;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: ConfigService) {}

  async getRoute(from: string, to: string): Promise<RouteResult> {
    const key = `${from}|${to}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const baseUrl = this.config.get<string>('osrm.url');
    const timeoutMs = this.config.get<number>('osrm.timeoutMs') ?? 8000;
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'Routing service is not configured',
      );
    }

    const [fromLat, fromLng] = from.split(',');
    const [toLat, toLng] = to.split(',');
    const url = `${baseUrl}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;

    const result = await this.fetchWithRetry(url, timeoutMs);
    if (result === null) {
      throw new ServiceUnavailableException('Routing service unavailable');
    }

    // Simple FIFO eviction once the cache grows past the budget.
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  /** Returns the parsed route, or null when every attempt failed. */
  private async fetchWithRetry(
    url: string,
    timeoutMs: number,
  ): Promise<RouteResult | null> {
    let lastReason = 'unknown error';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (res.status === 429 || res.status >= 500) {
          lastReason = `upstream HTTP ${res.status}`;
          throw new Error(lastReason);
        }
        if (!res.ok) {
          lastReason = `upstream HTTP ${res.status}`;
          throw new Error(lastReason);
        }

        const json = (await res.json()) as OsrmResponse;
        const route = json?.routes?.[0];
        if (
          !route?.geometry?.coordinates ||
          route.geometry.coordinates.length < 2
        ) {
          lastReason = `no route geometry (code=${json.code ?? 'n/a'})`;
          throw new Error(lastReason);
        }

        return {
          coordinates: route.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          ),
          distanceMeters: Math.round(route.distance ?? 0),
          durationSeconds: Math.round(route.duration ?? 0),
        };
      } catch (error) {
        const timedOut = (error as Error)?.name === 'AbortError';
        lastReason = timedOut
          ? `timed out after ${timeoutMs}ms`
          : ((error as Error)?.message ?? 'unknown error');

        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_BASE_DELAY_MS * attempt),
          );
        }
      } finally {
        clearTimeout(timer);
      }
    }

    this.logger.warn(
      `OSRM route failed after ${MAX_ATTEMPTS} attempts: ${lastReason}`,
    );
    return null;
  }
}
