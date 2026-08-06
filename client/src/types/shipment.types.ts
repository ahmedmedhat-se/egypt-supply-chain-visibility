export type ShipmentStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "at_checkpoint"
  | "customs_hold"
  | "customs_cleared"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "cancelled";

export interface MapPosition {
  latitude: number | null;
  longitude: number | null;
  name: string | null;
  city: string | null;
}

export interface Shipment {
  id: string;
  referenceNumber: string;
  status: ShipmentStatus;
  description: string | null;
  cargoType: string | null;
  weightKg: number | null;
  volumeM3: number | null;
  originAddress: string;
  destinationAddress: string;
  originCity: string;
  destinationCity: string;
  originPosition: MapPosition | null;
  destinationPosition: MapPosition | null;
  estimatedDepartureAt: string | null;
  estimatedArrivalAt: string | null;
  actualDepartureAt: string | null;
  actualArrivalAt: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  notes: string | null;
  shipperOrganization: {
    organization_id: string;
    organization_name: string;
  } | null;
  carrierOrganization: {
    organization_id: string;
    organization_name: string;
  } | null;
  carrierUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  route: {
    route_id: string;
    route_name: string;
    route_code: string;
    estimatedDays: number | null;
    checkpoints?: Array<{
      id: string;
      name: string;
      city: string;
      type: string | null;
      latitude: number | null;
      longitude: number | null;
      sequenceOrder: number;
      /** When the shipment actually reached this checkpoint (ISO string). */
      reachedAt?: string | null;
    }>;
  } | null;
  currentCheckpoint: {
    checkpoint_id: string;
    checkpoint_name: string;
    checkpoint_code: string;
    checkpoint_city: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  events?: ShipmentEvent[];
}

export interface CreateShipmentData {
  description?: string;
  cargoType?: string;
  originAddress: string;
  destinationAddress: string;
  originCity: string;
  destinationCity: string;
  weightKg?: number;
  volumeM3?: number;
  estimatedDepartureAt?: string;
  estimatedArrivalAt?: string;
  carrierOrganizationId?: string;
  routeId?: string;
  notes?: string;
}

export interface UpdateShipmentData {
  description?: string;
  cargoType?: string;
  originAddress?: string;
  destinationAddress?: string;
  originCity?: string;
  destinationCity?: string;
  weightKg?: number;
  volumeM3?: number;
  estimatedDepartureAt?: string;
  estimatedArrivalAt?: string;
  carrierOrganizationId?: string;
  routeId?: string;
  notes?: string;
}

export interface UpdateShipmentStatusData {
  status: ShipmentStatus;
  checkpointId?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShipmentEvent {
  id: string;
  type: string;
  status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  checkpointId: string | null;
  recordedByUserId: string | null;
  occurredAt: string;
}

export interface ShipmentQueryParams {
  status?: ShipmentStatus;
  excludeStatus?: ShipmentStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  scope?: "available" | "assigned";
}
