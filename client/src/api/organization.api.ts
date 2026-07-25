import apiClient from './client';
import type { OrgMember } from '../types/organization.types';

export const organizationApi = {
  /** Get all active members in the organization */
  getMembers: (orgId: string) =>
    apiClient.get<OrgMember[]>(`/api/organizations/${orgId}/members`),

  /** Get invitations for the organization (optional status filter) */
  getInvitations: (orgId: string, status?: string) =>
    apiClient.get<Array<{
      invitation_id: string;
      invited_email: string;
      invited_role: string;
      status: string;
      expires_at: string;
      created_at: string;
    }>>(`/api/organizations/${orgId}/invitations`, { params: { status } }),

  /** Invite a new user to the organization */
  invite: (orgId: string, data: { email: string; role: string }) =>
    apiClient.post(`/api/organizations/${orgId}/invitations`, data),

  /** Resend a pending invitation */
  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(`/api/organizations/${orgId}/invitations/${invitationId}/resend`),

  /** Cancel a pending invitation */
  cancelInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`),

  /** Deactivate a member */
  deactivateMember: (orgId: string, userId: string) =>
    apiClient.patch(`/api/organizations/${orgId}/members/${userId}/deactivate`),

  /** Activate a member */
  activateMember: (orgId: string, userId: string) =>
    apiClient.patch(`/api/organizations/${orgId}/members/${userId}/activate`),
};
