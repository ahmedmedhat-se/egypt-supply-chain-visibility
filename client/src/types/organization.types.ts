export interface OrgMember {
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_role: 'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator';
  user_is_active: boolean;
  user_created_at: string;
}
