import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../api/client";
import { showToast } from "../components/ui/Toast";
import { ROUTES } from "../constants/routes";
import type { LoginCredentials, RegisterData } from "../types/auth.types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      if (isLockedOut()) {
        throw new Error(
          `Account locked. Try again in ${getRemainingLockoutTime()} minutes.`,
        );
      }
      const response = await authApi.login(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      setLoginAttempts(0);
      setLockoutUntil(null);

      // Show welcome toast with the user's first name
      const firstName = data.user.name.split(" ")[0];
      showToast.success(`Welcome back, ${firstName}!`);
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION);
        showToast.error(
          "Too many failed attempts. Account locked for 15 minutes.",
        );
      } else {
        const message = extractErrorMessage(error);
        showToast.error(message);
      }
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await authApi.register(data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      const firstName = data.user.name.split(" ")[0];
      showToast.success(
        `Welcome, ${firstName}! Your account and organization have been created.`,
      );
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      const message = extractErrorMessage(error);
      showToast.error(message);
    },
  });

  // Forgot Password Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data),
    onSuccess: () => {
      showToast.success("Password reset link sent to your email.");
    },
    onError: (error: unknown) => {
      const message = extractErrorMessage(error);
      showToast.error(message);
    },
  });

  // Logout
  const logout = useCallback((): void => {
    // Fire-and-forget logout (server will clear cookie)
    authApi.logout().catch(() => {
      // Ignore errors — we're logging out anyway
    });
    clearAuth();
    navigate(ROUTES.LOGIN);
    showToast.info("You have been logged out.");
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
