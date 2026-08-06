import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin.api";
import { organizationApi } from "../api/organization.api";
import type { AuditLogFilters } from "../types/admin.types";

interface UseAuditLogsParams {
  /** Organization id — when present the query is scoped to that org (org admin view). */
  orgId?: string;
  filters?: AuditLogFilters;
  enabled?: boolean;
}

export const useAuditLogs = ({
  orgId,
  filters,
  enabled = true,
}: UseAuditLogsParams = {}) => {
  return useQuery({
    queryKey: ["audit-logs", orgId ?? "system", filters],
    queryFn: async () => {
      const response = orgId
        ? await organizationApi.getAuditLogs(orgId, filters)
        : await adminApi.getAuditLogs(filters);
      return response.data;
    },
    enabled,
  });
};
