export const DELAY_GRACE_MS = 6 * 60 * 60 * 1000;

export interface EtaCandidate {
  shipment_estimated_arrival_at: Date | null;
  shipment_actual_departure_at: Date | null;
  route?: { route_estimated_days: number | null } | null;
}

/**
 * The time the shipment should arrive by, from the DB.
 * Falls back to `route_estimated_days` from the actual departure when the
 * shipment has no explicit ETA. Returns null when neither is available.
 */
export function computeEffectiveEta(shipment: EtaCandidate): Date | null {
  if (shipment.shipment_estimated_arrival_at) {
    return new Date(shipment.shipment_estimated_arrival_at);
  }
  const days = shipment.route?.route_estimated_days ?? null;
  if (days != null && shipment.shipment_actual_departure_at) {
    return new Date(
      shipment.shipment_actual_departure_at.getTime() + days * 86_400_000,
    );
  }
  return null;
}

/** True when the effective ETA is past the configured grace window. */
export function isPastDelayGrace(
  eta: Date | null,
  now: Date = new Date(),
): boolean {
  if (!eta) return false;
  return eta.getTime() + DELAY_GRACE_MS < now.getTime();
}
