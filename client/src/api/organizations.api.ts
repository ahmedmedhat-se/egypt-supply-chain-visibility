import apiClient from './client';
import type {
  Organization,
  OrganizationMember,
  Invitation,
  CreateInvitationData,
} from '../types/organization.types';

export const organizationsApi = {
  getMembers: (orgId: string) =>
    apiClient.get<OrganizationMember[]>(`/api/organizations/${orgId}/members`),

  getInvitations: (orgId: string) =>
    apiClient.get<Invitation[]>(`/api/organizations/${orgId}/invitations`),

  createInvitation: (orgId: string, data: CreateInvitationData) =>
    apiClient.post<Invitation>(`/api/organizations/${orgId}/invitations`, data),

  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(`/api/organizations/${orgId}/invitations/${invitationId}/resend`),

  cancelInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`),
};
