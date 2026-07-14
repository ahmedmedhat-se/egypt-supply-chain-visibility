export const SHIPMENT_STATUSES = [
  'draft',
  'confirmed',
  'picked_up',
  'in_transit',
  'at_checkpoint',
  'customs_hold',
  'customs_cleared',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'delayed',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/**
 * Full state machine defining allowed transitions for each status.
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['at_checkpoint', 'out_for_delivery', 'delayed', 'cancelled'],
  at_checkpoint: ['customs_hold', 'customs_cleared', 'in_transit'],
  customs_hold: ['customs_cleared', 'cancelled'],
  customs_cleared: ['in_transit', 'out_for_delivery'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  delayed: ['in_transit', 'cancelled'],
};
