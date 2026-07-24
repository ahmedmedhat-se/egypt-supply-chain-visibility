export type ShipmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'at_checkpoint'
  | 'customs_hold'
  | 'customs_cleared'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

export interface Shipment {
  id: string;
  trackingNumber: string;
  description: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  shipperId: string;
  carrierId: string | null;
  carrierName: string | null;
  routeId: string | null;
  routeName: string | null;
  weight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentData {
  description: string;
  origin: string;
  destination: string;
  weight?: number;
  estimatedDelivery?: string;
  routeId?: string;
  notes?: string;
}

export interface UpdateShipmentData {
  description?: string;
  origin?: string;
  destination?: string;
  weight?: number;
  estimatedDelivery?: string;
  routeId?: string;
  notes?: string;
}

export interface UpdateShipmentStatusData {
  status: ShipmentStatus;
  checkpointId?: string;
  notes?: string;
}

export interface ShipmentQueryParams {
  status?: ShipmentStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
