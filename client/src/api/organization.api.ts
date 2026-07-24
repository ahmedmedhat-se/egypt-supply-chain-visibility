import apiClient from './client';
import type { OrgMember } from '../types/organization.types';

export const organizationApi = {
  /** Get all active members in the organization */
  getMembers: (orgId: string) =>
    apiClient.get<OrgMember[]>(`/api/organizations/${orgId}/members`),

  /** Get pending invitations for the organization */
  getInvitations: (orgId: string) =>
    apiClient.get<Array<{
      invitation_id: string;
      invited_email: string;
      invited_role: string;
      expires_at: string;
      created_at: string;
    }>>(`/api/organizations/${orgId}/invitations`),

  /** Invite a new user to the organization */
  invite: (orgId: string, data: { email: string; role: string }) =>
    apiClient.post(`/api/organizations/${orgId}/invitations`, data),

  /** Resend a pending invitation */
  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(`/api/organizations/${orgId}/invitations/${invitationId}/resend`),

  /** Cancel a pending invitation */
  cancelInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`),
};
