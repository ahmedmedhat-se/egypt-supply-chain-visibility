export interface PendingInvitation {
  invitation_id: string;
  invited_email: string;
  invited_role: string;
  expires_at: string;
  created_at: string;
}

export interface InviteFormData {
  email: string;
  role: 'shipper' | 'carrier' | 'regulator' | 'admin';
}

export interface InviteResponse {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export const INVITE_ROLES = [
  { value: 'shipper', label: 'Shipper' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'regulator', label: 'Regulator' },
  { value: 'admin', label: 'Admin' },
] as const;
