import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { showToast } from '../components/ui/Toast';
import { ROUTES } from '../constants/routes';
import type { LoginCredentials, RegisterData } from '../types/auth.types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Define error response type
interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Check if account is locked
  const isLockedOut = useCallback((): boolean => {
    if (!lockoutUntil) return false;
    return Date.now() < lockoutUntil;
  }, [lockoutUntil]);

  // Get remaining lockout time in minutes
  const getRemainingLockoutTime = useCallback((): number => {
    if (!lockoutUntil) return 0;
    return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 60000));
  }, [lockoutUntil]);

  // Get error message from API response
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError && error.response?.data) {
      const data = error.response.data as ErrorResponse;
      if (data.errors) {
        // Handle validation errors
        const firstError = Object.values(data.errors)[0];
        if (Array.isArray(firstError)) {
          return firstError[0] || 'Validation error';
        }
        return String(firstError) || 'Validation error';
      }
      if (data.message) {
        return data.message;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      if (isLockedOut()) {
        throw new Error(`Account locked. Try again in ${getRemainingLockoutTime()} minutes.`);
      }
      return authApi.login(credentials);
    },
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data;
      
      setAuth(user, accessToken, refreshToken);
      setLoginAttempts(0);
      setLockoutUntil(null);
      
      showToast.success(`Welcome back, ${user.firstName}!`);
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION);
        showToast.error('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        const message = getErrorMessage(error);
        showToast.error(message);
      }
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      const { user } = response.data;
      showToast.success(`Account created! Welcome ${user.firstName}. Please verify your email.`);
      navigate(ROUTES.LOGIN);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      showToast.error(message);
    },
  });

  // Forgot Password Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data),
    onSuccess: () => {
      showToast.success('Password reset link sent to your email.');
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      showToast.error(message);
    },
  });

  // Logout
  const logout = useCallback((): void => {
    clearAuth();
    navigate(ROUTES.LOGIN);
    showToast.info('You have been logged out.');
  }, [clearAuth, navigate]);

  return {
    // Login
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    
    // Register
    register: registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    
    // Forgot Password
    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordLoading: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    
    // Logout
    logout,
    
    // Auth State
    isAuthenticated,
    user,
    
    // Rate Limiting
    isLockedOut: isLockedOut(),
    remainingLockoutMinutes: getRemainingLockoutTime(),
    loginAttempts,
  };
};