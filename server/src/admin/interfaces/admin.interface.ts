export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    byRole?: Record<string, number>;
  };
  organizations: {
    total: number;
    active: number;
    byType?: Record<string, number>;
  };
  shipments: {
    total: number;
    byStatus: Array<{ shipment_status: string; _count: number }>;
  };
  alerts: {
    total: number;
    critical: number;
  };
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  organizationId?: string;
}

export interface AdminOrganizationFilters {
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface AdminShipmentFilters {
  status?: string;
  originCity?: string;
  destinationCity?: string;
  shipperId?: string;
  carrierId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminActionLog {
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValue: any | null;
  newValue: any | null;
  adminUserId: string;
  timestamp: Date;
}