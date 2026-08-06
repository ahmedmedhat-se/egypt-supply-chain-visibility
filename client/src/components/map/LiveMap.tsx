import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { useShipments } from '../../hooks/useShipments';
import { mapApi, type MapRoute } from '../../api/map.api';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge';
import { formatDate } from '../../lib/utils';
import type { Shipment, ShipmentStatus } from '../../types/shipment.types';

const EGYPT_CENTER: [number, number] = [26.8206, 30.8025];

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  draft: '#94A3B8',
  pending: '#94A3B8',
  confirmed: '#3B82F6',
  picked_up: '#3B82F6',
  in_transit: '#0EA5E9',
  at_checkpoint: '#F59E0B',
  customs_hold: '#EF4444',
  customs_cleared: '#10B981',
  out_for_delivery: '#2563EB',
  delivered: '#10B981',
  delayed: '#F59E0B',
  cancelled: '#EF4444',
};

const primaryPosition = (shipment: Shipment | null): { lat: number; lng: number } | null => {
  if (!shipment) return null;
  if (shipment.currentLatitude != null && shipment.currentLongitude != null) {
    return { lat: shipment.currentLatitude, lng: shipment.currentLongitude };
  }
  const origin = shipment.originPosition;
  if (origin?.latitude != null && origin.longitude != null) {
    return { lat: origin.latitude, lng: origin.longitude };
  }
  return null;
};

interface Point3 {
  lat: number;
  lng: number;
  label: string;
}

/** Derives the truck position, origin and destination points for a shipment. */
const shipmentPoints = (shipment: Shipment | null): {
  pos: { lat: number; lng: number } | null;
  originPoint: Point3 | null;
  destinationPoint: Point3 | null;
} => {
  const pos = primaryPosition(shipment);
  const origin = shipment?.originPosition;
  const destination = shipment?.destinationPosition;
  const originPoint =
    origin?.latitude != null && origin.longitude != null
      ? {
          lat: origin.latitude,
          lng: origin.longitude,
          label: origin.city || origin.name || 'Origin',
        }
      : null;
  const destinationPoint =
    destination?.latitude != null && destination.longitude != null
      ? {
          lat: destination.latitude,
          lng: destination.longitude,
          label: destination.city || destination.name || 'Destination',
        }
      : null;
  return { pos, originPoint, destinationPoint };
};

const tripDuration = (shipment: Shipment): string | null => {
  const days = shipment.route?.estimatedDays;
  if (days != null && days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const dep = shipment.estimatedDepartureAt;
  const arr = shipment.estimatedArrivalAt;
  if (dep && arr) {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    if (!Number.isNaN(diffMs) && diffMs > 0) {
      const diffDays = Math.ceil(diffMs / 86_400_000);
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
  }
  return null;
};

const formatDriveDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
};

const formatRoadDistance = (meters: number): string => {
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km).toLocaleString()} km` : `${km.toFixed(1)} km`;
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/** Index of the route vertex closest to the given point (used to split driven vs remaining). */
const nearestVertexIndex = (
  point: { lat: number; lng: number },
  path: [number, number][],
): number => {
  let best = 0;
  let bestDist = Infinity;
  path.forEach(([lat, lng], i) => {
    const d = haversineKm(point, { lat, lng });
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
};

const makeIcon = (color: string, selected: boolean): L.DivIcon => {
  const ring = selected
    ? `<span class="live-pin-ring" style="border-color:${color}"></span>`
    : '';
  return L.divIcon({
    className: 'live-pin',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `${ring}<span class="live-pin-dot" style="background:${color}"></span>`,
  });
};

interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Popup content shared by the selected-shipment marker (react-leaflet <Popup>)
 * and the cluster markers (native Leaflet, serialized via renderToStaticMarkup).
 * Rendered as JSX so React compiles it — passing the raw HTML string to
 * <Popup> used to print the source as plain text.
 */
const ShipmentPopupContent = ({
  shipment,
  routeInfo,
}: {
  shipment: Shipment;
  routeInfo?: RouteInfo | null;
}) => {
  const color = STATUS_COLORS[shipment.status] ?? '#94A3B8';
  const duration = tripDuration(shipment);
  const pos = primaryPosition(shipment);
  const etaFallback = shipment.estimatedArrivalAt
    ? formatDate(shipment.estimatedArrivalAt)
    : '—';
  return (
    <div className="live-popup">
      <div className="live-popup-ref">
        <span className="live-popup-dot" style={{ background: color }} />
        <strong>{shipment.referenceNumber}</strong>
      </div>
      <div className="live-popup-route">
        {shipment.originCity} → {shipment.destinationCity}
      </div>
      {routeInfo ? (
        <>
          <div className="live-popup-row">
            <span>Arrives</span>
            <strong>in ~{formatDriveDuration(routeInfo.durationSeconds)}</strong>
          </div>
          <div className="live-popup-row">
            <span>Road distance</span>
            <strong>~ {formatRoadDistance(routeInfo.distanceMeters)}</strong>
          </div>
        </>
      ) : (
        <>
          <div className="live-popup-row">
            <span>ETA</span>
            <strong>{etaFallback}</strong>
          </div>
          {duration && (
            <div className="live-popup-row">
              <span>Trip length</span>
              <strong>{duration}</strong>
            </div>
          )}
        </>
      )}
      {pos && (
        <div className="live-popup-row">
          <span>Position</span>
          <strong>
            {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
          </strong>
        </div>
      )}
    </div>
  );
};

// Client-side route cache so re-selecting a shipment is instant and we never
// hammer the routing proxy with identical requests.
const routeCache = new Map<string, MapRoute>();
// Keys currently being fetched, so two hooks requesting the same segment
// (e.g. journey === remaining when a shipment hasn't departed) share one call.
const pendingRoutes = new Set<string>();

const cacheRoute = (key: string, route: MapRoute) => {
  if (routeCache.size >= 300) {
    const oldest = routeCache.keys().next().value;
    if (oldest !== undefined) routeCache.delete(oldest);
  }
  routeCache.set(key, route);
};

interface RouteState {
  route: MapRoute | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

interface ResolvedState {
  key: string;
  route: MapRoute | null;
  status: 'ready' | 'error';
}

/**
 * Fetches a real road route for a segment, memoized by its endpoints.
 * The in-memory cache is read during render (never mutated there), so a
 * cached route renders instantly; only async fetch completion mutates state.
 */
function useOsrmRoute(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number } | null,
  enabled = true,
): RouteState {
  const fromKey = from ? `${from.lat.toFixed(5)},${from.lng.toFixed(5)}` : '';
  const toKey = to ? `${to.lat.toFixed(5)},${to.lng.toFixed(5)}` : '';
  const requestKey = from && to ? `${fromKey}|${toKey}` : '';

  const [resolved, setResolved] = useState<ResolvedState>({
    key: '',
    route: null,
    status: 'ready',
  });

  // Side-effect-free cache read for the current request key.
  const cachedAtRender = requestKey ? routeCache.get(requestKey) : undefined;

  useEffect(() => {
    if (!enabled || !from || !to) return;
    if (cachedAtRender) return; // render path already serves the cached route
    if (pendingRoutes.has(requestKey)) return; // another hook is fetching it

    const controller = new AbortController();
    pendingRoutes.add(requestKey);
    mapApi
      .getRoute([from.lat, from.lng], [to.lat, to.lng], controller.signal)
      .then((route) => {
        pendingRoutes.delete(requestKey);
        cacheRoute(requestKey, route);
        if (!controller.signal.aborted) {
          setResolved({ key: requestKey, route, status: 'ready' });
        }
      })
      .catch(() => {
        pendingRoutes.delete(requestKey);
        if (!controller.signal.aborted) {
          setResolved({ key: requestKey, route: null, status: 'error' });
        }
      });

    return () => controller.abort();
  }, [requestKey, from, to, cachedAtRender, enabled]);

  if (!enabled || !requestKey) {
    return { route: null, status: 'idle' };
  }
  if (resolved.key === requestKey) {
    return { route: resolved.route, status: resolved.status };
  }
  if (cachedAtRender) {
    return { route: cachedAtRender, status: 'ready' };
  }
  return { route: null, status: 'loading' };
}

interface CheckpointView {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  reachedAt?: string | null;
  isPassed: boolean;
}

/**
 * A route checkpoint on the map with an always-visible badge: passed ones
 * show the date the shipment reached them, upcoming ones show a live road ETA
 * from the truck's current position (computed with OSRM).
 */
function CheckpointMarker({
  checkpoint,
  isCurrent,
  from,
}: {
  checkpoint: CheckpointView;
  isCurrent: boolean;
  from: { lat: number; lng: number } | null;
}) {
  const to = { lat: checkpoint.latitude, lng: checkpoint.longitude };
  // Passed checkpoints don't need a route (no ETA) — skip the fetch entirely.
  const { route, status } = useOsrmRoute(from, to, !checkpoint.isPassed);

  const color = isCurrent
    ? '#2563EB'
    : checkpoint.isPassed
      ? '#10B981'
      : '#F59E0B';

  const badge = checkpoint.isPassed
    ? checkpoint.reachedAt
      ? `Reached ${formatDate(checkpoint.reachedAt)}`
      : 'Reached'
    : route
      ? `ETA ~${formatDriveDuration(route.durationSeconds)}`
      : status === 'error'
        ? 'Route unavailable'
        : '…';

  return (
    <CircleMarker
      center={[checkpoint.latitude, checkpoint.longitude]}
      radius={isCurrent ? 8 : 6}
      pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 2 }}
    >
      <Tooltip permanent direction="top" offset={[0, -7]} className="cp-badge">
        <strong>{checkpoint.name}</strong>
        <span className="cp-badge-sub">{badge}</span>
      </Tooltip>
    </CircleMarker>
  );
}

/**
 * Always-visible ETA badge (bottom-right of the map) for the selected
 * shipment — computed from the real OSRM road distance/duration.
 */
function SelectedRouteBadge({ shipment }: { shipment: Shipment | null }) {
  const { pos, originPoint, destinationPoint } = useMemo(
    () => shipmentPoints(shipment),
    [shipment],
  );
  const journey = useOsrmRoute(originPoint, destinationPoint);
  const remaining = useOsrmRoute(pos, destinationPoint);
  const primary =
    remaining.status === 'ready'
      ? remaining
      : journey.status === 'ready'
        ? journey
        : null;

  if (!shipment || !primary?.route) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs shadow dark:bg-[#0F2A44]/95">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
        <span className="font-semibold text-[#0A2E4A] dark:text-white">
          {shipment.referenceNumber}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
        <span>
          ETA{' '}
          <strong className="font-semibold text-[#0A2E4A] dark:text-white">
            ~{formatDriveDuration(primary.route.durationSeconds)}
          </strong>
        </span>
        <span aria-hidden>·</span>
        <span>{formatRoadDistance(primary.route.distanceMeters)}</span>
      </div>
    </div>
  );
}

function ClusterLayer({
  shipments,
  selectedId,
  onSelect,
}: {
  shipments: Shipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({ maxClusterRadius: 45 });
    shipments.forEach((shipment) => {
      if (shipment.id === selectedId) return;
      const pos = primaryPosition(shipment);
      if (!pos) return;
      const marker = L.marker([pos.lat, pos.lng], {
        icon: makeIcon(STATUS_COLORS[shipment.status] ?? '#94A3B8', false),
        title: shipment.referenceNumber,
      });
      marker.bindPopup(renderToStaticMarkup(<ShipmentPopupContent shipment={shipment} />));
      marker.on('click', () => onSelect(shipment.id));
      group.addLayer(marker);
    });
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [shipments, selectedId, map, onSelect]);

  return null;
}

function SelectedShipmentLayer({ shipment }: { shipment: Shipment | null }) {
  const { pos, originPoint, destinationPoint } = useMemo(
    () => shipmentPoints(shipment),
    [shipment],
  );

  // Real road routes: the full planned journey (origin → destination) and,
  // when the truck is moving, the remaining leg (position → destination).
  const journey = useOsrmRoute(originPoint, destinationPoint);
  const remaining = useOsrmRoute(pos, destinationPoint);

  // Split the full route at the truck's projected position so the already
  // driven road and the road ahead are drawn in different colors.
  const splitIndex = useMemo(() => {
    const coords = journey.route?.coordinates;
    if (!coords || coords.length < 2) return null;
    if (!pos) return 0; // not departed yet → everything is ahead
    if (shipment?.status === 'delivered') return coords.length - 1; // all driven
    return nearestVertexIndex(pos, coords);
  }, [journey.route, pos, shipment?.status]);

  const traveledPath = useMemo(() => {
    if (!journey.route || splitIndex === null || splitIndex <= 0) return [];
    return journey.route.coordinates.slice(0, splitIndex + 1);
  }, [journey.route, splitIndex]);

  const remainingPath = useMemo(() => {
    if (!journey.route || splitIndex === null) return [];
    if (shipment?.status === 'delivered') return [];
    return journey.route.coordinates.slice(splitIndex);
  }, [journey.route, splitIndex, shipment?.status]);

  // Dashed straight-line fallback, only used while a road route is loading
  // or unavailable — the map never breaks.
  const pathPoints = useMemo(() => {
    const points: [number, number][] = [];
    if (originPoint) points.push([originPoint.lat, originPoint.lng]);
    if (pos) points.push([pos.lat, pos.lng]);
    if (destinationPoint) points.push([destinationPoint.lat, destinationPoint.lng]);
    return points;
  }, [originPoint, pos, destinationPoint]);

  const primary =
    remaining.status === 'ready'
      ? remaining
      : journey.status === 'ready'
        ? journey
        : null;

  const routeInfo: RouteInfo | null = useMemo(() => {
    const route = primary?.route;
    if (!route) return null;
    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    };
  }, [primary?.route]);

  // Route checkpoints with passed/upcoming classification.
  const checkpoints = useMemo<CheckpointView[]>(() => {
    if (!shipment?.route?.checkpoints) return [];
    const currentId = shipment.currentCheckpoint?.checkpoint_id ?? null;
    const currentSeq =
      shipment.route.checkpoints.find((c) => c.id === currentId)?.sequenceOrder ??
      Infinity;
    return shipment.route.checkpoints
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({
        ...c,
        latitude: c.latitude as number,
        longitude: c.longitude as number,
        isPassed:
          c.reachedAt != null ||
          shipment.status === 'delivered' ||
          c.sequenceOrder < currentSeq,
      }));
  }, [shipment]);

  if (!shipment) return null;

  return (
    <>
      {originPoint && (
        <CircleMarker
          center={[originPoint.lat, originPoint.lng]}
          radius={7}
          pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Origin</strong>
            <div>{originPoint.label}</div>
          </Popup>
        </CircleMarker>
      )}
      {destinationPoint && (
        <CircleMarker
          center={[destinationPoint.lat, destinationPoint.lng]}
          radius={7}
          pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Destination</strong>
            <div>{destinationPoint.label}</div>
          </Popup>
        </CircleMarker>
      )}
      {journey.route ? (
        <>
          {traveledPath.length > 1 && (
            <Polyline
              positions={traveledPath}
              pathOptions={{ color: '#10B981', weight: 4, opacity: 0.75 }}
            />
          )}
          {remainingPath.length > 1 && (
            <Polyline
              positions={remainingPath}
              pathOptions={{ color: '#0EA5E9', weight: 4, opacity: 0.95 }}
            />
          )}
        </>
      ) : remaining.route ? (
        // Full-journey route unavailable but the remaining leg is — draw it
        // solid instead of degrading to the dashed fallback.
        <Polyline
          positions={remaining.route.coordinates}
          pathOptions={{ color: '#0EA5E9', weight: 4, opacity: 0.95 }}
        />
      ) : (
        pathPoints.length > 1 && (
          <Polyline
            positions={pathPoints}
            pathOptions={{ color: '#0EA5E9', weight: 3, dashArray: '6 8', opacity: 0.9 }}
          />
        )
      )}
      {checkpoints.map((checkpoint) => (
        <CheckpointMarker
          key={checkpoint.id}
          checkpoint={checkpoint}
          isCurrent={checkpoint.id === shipment.currentCheckpoint?.checkpoint_id}
          from={pos ?? originPoint}
        />
      ))}
      {pos && (
        <Marker
          position={[pos.lat, pos.lng]}
          icon={makeIcon(STATUS_COLORS[shipment.status] ?? '#0EA5E9', true)}
        >
          <Popup>
            <ShipmentPopupContent shipment={shipment} routeInfo={routeInfo} />
          </Popup>
        </Marker>
      )}
    </>
  );
}

function FlyToSelected({ shipment }: { shipment: Shipment | null }) {
  const map = useMap();

  useEffect(() => {
    const pos = shipment ? primaryPosition(shipment) : null;
    if (!pos) return;
    map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [shipment, map]);

  return null;
}

interface LiveMapProps {
  className?: string;
  mapHeightClassName?: string;
  pageLimit?: number;
}

export const LiveMap = ({
  className,
  mapHeightClassName = 'h-[62vh] min-h-[420px]',
  pageLimit = 10,
}: LiveMapProps) => {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useShipments({
    page,
    limit: pageLimit,
    excludeStatus: 'draft',
  });

  // Stable reference so downstream useMemo/useEffect deps don't churn every render
  const shipments: Shipment[] = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const positionedCount = shipments.filter((s) => primaryPosition(s)).length;

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedId) ?? null,
    [shipments, selectedId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        Failed to load live shipments.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white dark:border-[#1E3A5F] dark:bg-[#0F2A44]">
          <div className="border-b border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A5F]">
            <h2 className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
              Shipments <span className="ml-1 text-xs font-normal text-[#94A3B8]">({positionedCount} on map)</span>
            </h2>
          </div>
          <div className="max-h-[50vh] flex-1 overflow-y-auto">
            {shipments.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#94A3B8]">No shipments yet.</p>
            ) : (
              <ul className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                {shipments.map((shipment) => {
                  const pos = primaryPosition(shipment);
                  const active = shipment.id === selectedId;
                  return (
                    <li key={shipment.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(active ? null : shipment.id)}
                        onMouseEnter={() => {
                          if (!selectedId && pos) {
                            setSelectedId(shipment.id);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#F1F5F9] dark:hover:bg-[#0B2238] ${
                          active ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-[#0A2E4A] dark:text-white">
                            {shipment.referenceNumber}
                          </span>
                          <ShipmentStatusBadge status={shipment.status} />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                          <span className="truncate">
                            {shipment.originCity} → {shipment.destinationCity}
                          </span>
                          {tripDuration(shipment) && (
                            <span className="shrink-0 rounded-md bg-[#F1F5F9] px-1.5 py-0.5 font-medium text-[#64748B] dark:bg-[#0B2238] dark:text-[#94A3B8]">
                              {tripDuration(shipment)}
                            </span>
                          )}
                          {shipment.estimatedArrivalAt && (
                            <span className="shrink-0">ETA {formatDate(shipment.estimatedArrivalAt)}</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {meta && meta.totalItems > 0 && (
            <div className="border-t border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A5F]">
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                totalItems={meta.totalItems}
                limit={pageLimit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {/* z-0 + isolate contain Leaflet's internal panes (z-index up to 1000)
            inside this container, so overlays like the topbar notification
            popup render above the map instead of underneath it. */}
        <div
          className={`${mapHeightClassName} relative z-0 isolate overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#EAF0F6] dark:border-[#1E3A5F]`}
        >
          <MapContainer
            center={EGYPT_CENTER}
            zoom={6}
            scrollWheelZoom
            className="h-full w-full"
            style={{ minHeight: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusterLayer
              shipments={shipments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <SelectedShipmentLayer shipment={selectedShipment} />
            <FlyToSelected shipment={selectedShipment} />
          </MapContainer>
          <SelectedRouteBadge shipment={selectedShipment} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs shadow dark:bg-[#0F2A44]/90">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#64748B] dark:text-[#94A3B8]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#10B981] shadow" /> Origin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#EF4444] shadow" /> Destination
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-[#10B981]" /> Driven
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-[#0EA5E9]" /> Remaining
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Checkpoint
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
