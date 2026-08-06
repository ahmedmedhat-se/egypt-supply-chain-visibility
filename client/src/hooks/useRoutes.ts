import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routesApi } from "../api/routes.api";
import { extractErrorMessage } from "../api/client";
import type {
  CreateRouteData,
  UpdateRouteData,
  AddRouteCheckpointData,
} from "../types/route.types";
import toast from "react-hot-toast";

export const useRoutes = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: async () => {
      const response = await routesApi.getAll(params);
      return response.data;
    },
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRouteData) => {
      const response = await routesApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Route created successfully!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to create route");
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRouteData }) => {
      const response = await routesApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Route updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to update route");
    },
  });
};

export const useAddRouteCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      data,
    }: {
      routeId: string;
      data: AddRouteCheckpointData;
    }) => {
      const response = await routesApi.addCheckpoint(routeId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint added to route!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(
        extractErrorMessage(error) || "Failed to add checkpoint to route",
      );
    },
  });
};

export const useActivateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await routesApi.activate(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Route activated!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to activate route");
    },
  });
};

export const useDeactivateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await routesApi.deactivate(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Route deactivated!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to deactivate route");
    },
  });
};

export const useRemoveRouteCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routeId,
      checkpointId,
    }: {
      routeId: string;
      checkpointId: string;
    }) => {
      const response = await routesApi.removeCheckpoint(routeId, checkpointId);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Checkpoint removed from route!");
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to remove checkpoint");
    },
  });
};
