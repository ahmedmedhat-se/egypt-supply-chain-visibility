import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi } from '../api/shipments.api';
import type { ShipmentQueryParams, CreateShipmentData } from '../types/shipment.types';
import toast from 'react-hot-toast';

export const useShipments = (params?: ShipmentQueryParams) => {
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: async () => {
      const response = await shipmentsApi.getAll(params);
      return response.data; // response is axios Response, so response.data contains { data, meta }
    },
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
      toast.success('Shipment created successfully!');
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    },
  });
};
