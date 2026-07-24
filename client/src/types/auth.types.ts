export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
  organizationType: string;
  organizationEmail: string;
  organizationCountry?: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator';
  organizationId: string;
  organizationName: string;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface AcceptInvitationData {
  token: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
