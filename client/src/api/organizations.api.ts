import apiClient from "./client";
import type {
  OrganizationMember,
  Invitation,
  CreateInvitationData,
} from "../types/organization.types";
import type { PaginatedResponse } from "../types/pagination.types";

export const organizationsApi = {
  getMembers: (orgId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<OrganizationMember>>(
      `/api/organizations/${orgId}/members`,
      { params },
    ),

  getInvitations: (
    orgId: string,
    params?: { page?: number; limit?: number; status?: string },
  ) =>
    apiClient.get<PaginatedResponse<Invitation>>(
      `/api/organizations/${orgId}/invitations`,
      { params },
    ),

  createInvitation: (orgId: string, data: CreateInvitationData) =>
    apiClient.post<Invitation>(`/api/organizations/${orgId}/invitations`, data),

  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(
      `/api/organizations/${orgId}/invitations/${invitationId}/resend`,
    ),

  cancelInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`),
};
