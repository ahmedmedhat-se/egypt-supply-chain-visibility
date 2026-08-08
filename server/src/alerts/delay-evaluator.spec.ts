import {
  computeEffectiveEta,
  isPastDelayGrace,
  DELAY_GRACE_MS,
} from './delay-evaluator';

describe('computeEffectiveEta', () => {
  it('returns the explicit ETA when present', () => {
    const eta = new Date('2026-08-10T12:00:00Z');
    const result = computeEffectiveEta({
      shipment_estimated_arrival_at: eta,
      shipment_actual_departure_at: null,
      route: { route_estimated_days: 3 },
    });
    expect(result?.toISOString()).toBe(eta.toISOString());
  });

  it('falls back to actual departure + route days when there is no ETA', () => {
    const dep = new Date('2026-08-01T08:00:00Z');
    const result = computeEffectiveEta({
      shipment_estimated_arrival_at: null,
      shipment_actual_departure_at: dep,
      route: { route_estimated_days: 2 },
    });
    expect(result?.toISOString()).toBe(
      new Date('2026-08-03T08:00:00Z').toISOString(),
    );
  });

  it('returns null when neither an ETA nor route days are available', () => {
    const result = computeEffectiveEta({
      shipment_estimated_arrival_at: null,
      shipment_actual_departure_at: new Date(),
      route: { route_estimated_days: null },
    });
    expect(result).toBeNull();
  });

  it('returns null when nothing is available at all', () => {
    const result = computeEffectiveEta({
      shipment_estimated_arrival_at: null,
      shipment_actual_departure_at: null,
      route: null,
    });
    expect(result).toBeNull();
  });
});

describe('isPastDelayGrace', () => {
  it('is false for a null ETA', () => {
    expect(isPastDelayGrace(null)).toBe(false);
  });

  it('is false while the ETA is still inside the grace window', () => {
    const eta = new Date(Date.now() - DELAY_GRACE_MS + 60_000);
    expect(isPastDelayGrace(eta)).toBe(false);
  });

  it('is true once the ETA is past the grace window', () => {
    const eta = new Date(Date.now() - DELAY_GRACE_MS - 60_000);
    expect(isPastDelayGrace(eta)).toBe(true);
  });
});
