import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkpointsApi } from "../api/checkpoints.api";
import { extractErrorMessage } from "../api/client";
import type {
  CreateCheckpointData,
  UpdateCheckpointData,
} from "../types/checkpoint.types";
import toast from "react-hot-toast";

export const useCheckpoints = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["checkpoints", params],
    queryFn: async () => {
      const response = await checkpointsApi.getAll(params);
      return response.data;
    },
  });
};

export const useCreateCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCheckpointData) => {
      const response = await checkpointsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint created successfully!");
      queryClient.invalidateQueries({ queryKey: ["checkpoints"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to create checkpoint");
    },
  });
};

export const useActivateCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await checkpointsApi.activate(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint activated!");
      queryClient.invalidateQueries({ queryKey: ["checkpoints"] });
    },
    onError: (error: unknown) => {
      toast.error(
        extractErrorMessage(error) || "Failed to activate checkpoint",
      );
    },
  });
};

export const useDeactivateCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await checkpointsApi.deactivate(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint deactivated!");
      queryClient.invalidateQueries({ queryKey: ["checkpoints"] });
    },
    onError: (error: unknown) => {
      toast.error(
        extractErrorMessage(error) || "Failed to deactivate checkpoint",
      );
    },
  });
};

export const useUpdateCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCheckpointData;
    }) => {
      const response = await checkpointsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["checkpoints"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to update checkpoint");
    },
  });
};
