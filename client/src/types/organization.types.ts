export interface OrgMember {
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_role: 'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator';
  user_is_active: boolean;
  user_created_at: string;
}

export interface OrganizationMember extends OrgMember {}

export interface Organization {
  organization_id: string;
  organization_name: string;
  organization_type: 'shipper' | 'carrier' | 'regulator';
  organization_is_active: boolean;
  organization_created_at: string;
  organization_updated_at: string;
}

export interface Invitation {
  invitation_id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator';
  organization_id: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface CreateInvitationData {
  email: string;
  role: string;
}
