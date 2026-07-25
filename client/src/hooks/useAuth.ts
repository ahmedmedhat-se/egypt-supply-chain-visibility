import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../api/client";
import { showToast } from "../components/ui/Toast";
import { ROUTES } from "../constants/routes";
import type { LoginCredentials, RegisterData } from "../types/auth.types";

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);

      // Show welcome toast with the user's first name
      const firstName = data.user.name.split(" ")[0];
      showToast.success(`Welcome back, ${firstName}!`);
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      const message = extractErrorMessage(error);
      showToast.error(message);
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
    // 1. Send logout request FIRST while token is still valid
    // 2. Then clear auth state — this avoids triggering the 401 refresh interceptor
    authApi
      .logout()
      .catch(() => {
        // Ignore errors — we're logging out anyway
      })
      .finally(() => {
        clearAuth();
        navigate(ROUTES.LOGIN);
        showToast.info("You have been logged out.");
      });
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
  };
};
