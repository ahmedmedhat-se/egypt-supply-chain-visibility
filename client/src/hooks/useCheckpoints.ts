import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkpointsApi } from '../api/checkpoints.api';
import type { CreateCheckpointData, UpdateCheckpointData } from '../types/checkpoint.types';
import toast from 'react-hot-toast';

export const useCheckpoints = (params?: { isActive?: boolean }) => {
  return useQuery({
    queryKey: ['checkpoints', params],
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
      toast.success('Checkpoint created successfully!');
      queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create checkpoint');
    },
  });
};

export const useUpdateCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCheckpointData }) => {
      const response = await checkpointsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Checkpoint updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update checkpoint');
    },
  });
};
