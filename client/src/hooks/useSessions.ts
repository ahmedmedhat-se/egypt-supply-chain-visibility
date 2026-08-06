import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../api/client";
import toast from "react-hot-toast";

export const useSessions = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["auth-sessions", params],
    queryFn: async () => {
      const response = await authApi.getSessions(params);
      return response.data;
    },
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      toast.success("Session revoked");
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to revoke session");
    },
  });
};

export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.revokeAllSessions(),
    onSuccess: () => {
      toast.success("Signed out on all other devices");
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
    onError: (error: unknown) => {
      toast.error(
        extractErrorMessage(error) || "Failed to sign out other devices",
      );
    },
  });
};
