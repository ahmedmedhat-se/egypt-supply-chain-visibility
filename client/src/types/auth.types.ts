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
  confirmPassword: string;
  organizationName: string;
  organizationType: 'shipper' | 'carrier' | 'regulator';
  phone?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'shipper' | 'carrier' | 'regulator';
    organizationId: string;
    organizationName: string;
    organizationType: string;
    isActive: boolean;
    lastLoginAt: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}