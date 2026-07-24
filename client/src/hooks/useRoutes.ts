import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '../api/routes.api';
import type { CreateRouteData, UpdateRouteData, AddRouteCheckpointData } from '../types/route.types';
import toast from 'react-hot-toast';

export const useRoutes = (params?: { isActive?: boolean }) => {
  return useQuery({
    queryKey: ['routes', params],
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
      toast.success('Route created successfully!');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create route');
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
      toast.success('Route updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update route');
    },
  });
};

export const useAddRouteCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, data }: { routeId: string; data: AddRouteCheckpointData }) => {
      const response = await routesApi.addCheckpoint(routeId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Checkpoint added to route!');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add checkpoint to route');
    },
  });
};

export const useRemoveRouteCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, checkpointId }: { routeId: string; checkpointId: string }) => {
      const response = await routesApi.removeCheckpoint(routeId, checkpointId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Checkpoint removed from route!');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove checkpoint');
    },
  });
};
