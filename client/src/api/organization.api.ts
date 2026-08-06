import apiClient from "./client";
import type { OrgMember, OrgInvitation } from "../types/organization.types";
import type { PaginatedResponse } from "../types/pagination.types";
import type { AuditLogEntry, AuditLogFilters } from "../types/admin.types";

export const organizationApi = {
  /** Get members of the organization (paginated, optional active filter) */
  getMembers: (
    orgId: string,
    params?: { page?: number; limit?: number; isActive?: boolean },
  ) =>
    apiClient.get<PaginatedResponse<OrgMember>>(
      `/api/organizations/${orgId}/members`,
      { params },
    ),

  /** Get invitations for the organization (optional status filter, paginated) */
  getInvitations: (
    orgId: string,
    status?: string,
    params?: { page?: number; limit?: number },
  ) =>
    apiClient.get<PaginatedResponse<OrgInvitation>>(
      `/api/organizations/${orgId}/invitations`,
      {
        params: { status, ...params },
      },
    ),

  /** Invite a new user to the organization */
  invite: (orgId: string, data: { email: string; role: string }) =>
    apiClient.post(`/api/organizations/${orgId}/invitations`, data),

  /** Resend a pending invitation */
  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(
      `/api/organizations/${orgId}/invitations/${invitationId}/resend`,
    ),

  /** Cancel a pending invitation */
  cancelInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`),

  /** Deactivate a member */
  deactivateMember: (orgId: string, userId: string) =>
    apiClient.patch(`/api/organizations/${orgId}/members/${userId}/deactivate`),

  /** Activate a member */
  activateMember: (orgId: string, userId: string) =>
    apiClient.patch(`/api/organizations/${orgId}/members/${userId}/activate`),

  /** Get audit logs scoped to this organization (org admin + super admin) */
  getAuditLogs: (orgId: string, params?: AuditLogFilters) =>
    apiClient.get<PaginatedResponse<AuditLogEntry>>(
      `/api/organizations/${orgId}/audit-logs`,
      { params },
    ),
};
