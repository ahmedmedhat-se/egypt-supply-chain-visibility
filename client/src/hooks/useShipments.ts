import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentsApi } from "../api/shipments.api";
import { extractErrorMessage } from "../api/client";
import type {
  ShipmentQueryParams,
  CreateShipmentData,
  UpdateShipmentData,
  UpdateShipmentStatusData,
} from "../types/shipment.types";
import toast from "react-hot-toast";

export const useShipments = (params?: ShipmentQueryParams) => {
  // `enabled` controls fetching (e.g. lazy tabs) but is intentionally kept out
  // of the query key so toggling it doesn't re-key cached data.
  const { enabled, ...query } = params ?? {};
  return useQuery({
    queryKey: ["shipments", query],
    queryFn: async () => {
      const response = await shipmentsApi.getAll(query);
      return response.data; // response is axios Response, so response.data contains { data, meta }
    },
    ...(enabled !== undefined && { enabled }),
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShipmentData) => {
      const response = await shipmentsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Shipment created successfully!");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to create shipment");
    },
  });
};

export const useAcceptShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await shipmentsApi.acceptShipment(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Shipment accepted successfully!");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to accept shipment");
    },
  });
};

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateShipmentStatusData;
    }) => {
      const response = await shipmentsApi.updateStatus(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Shipment status updated!");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to update status");
    },
  });
};

export const useAssignRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, routeId }: { id: string; routeId: string }) => {
      const response = await shipmentsApi.assignRoute(id, { routeId });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Route assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment-detail"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to assign route");
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateShipmentData;
    }) => {
      const response = await shipmentsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Shipment updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || "Failed to update shipment");
    },
  });
};
