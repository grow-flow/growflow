import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Growbox } from '../types/models';

// Query Keys
export const growboxKeys = {
  all: ['growboxes'] as const,
  lists: () => [...growboxKeys.all, 'list'] as const,
  list: (filters: string) => [...growboxKeys.lists(), { filters }] as const,
  details: () => [...growboxKeys.all, 'detail'] as const,
  detail: (id: number) => [...growboxKeys.details(), id] as const,
};

// Growboxes List Query
export const useGrowboxes = () => {
  return useQuery({
    queryKey: growboxKeys.lists(),
    queryFn: () => apiService.getGrowboxes(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Single Growbox Query
export const useGrowbox = (id: number) => {
  return useQuery({
    queryKey: growboxKeys.detail(id),
    queryFn: () => apiService.getGrowbox(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Create Growbox Mutation
export const useCreateGrowbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Growbox>) => apiService.createGrowbox(data),
    onSuccess: (newGrowbox) => {
      // Invalidate and refetch growboxes list
      queryClient.invalidateQueries({ queryKey: growboxKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData(growboxKeys.lists(), (old: Growbox[] = []) => [
        ...old,
        newGrowbox
      ]);
    },
    onError: (error) => {
      console.error('Failed to create growbox:', error);
    },
  });
};

// Update Growbox Mutation
export const useUpdateGrowbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Growbox> }) =>
      apiService.updateGrowbox(id, data),
    onSuccess: (updatedGrowbox) => {
      // Update specific growbox in cache
      queryClient.setQueryData(
        growboxKeys.detail(updatedGrowbox.id),
        updatedGrowbox
      );
      
      // Update in list cache
      queryClient.setQueryData(growboxKeys.lists(), (old: Growbox[] = []) =>
        old.map(box => box.id === updatedGrowbox.id ? updatedGrowbox : box)
      );
    },
  });
};

// Delete Growbox Mutation
export const useDeleteGrowbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteGrowbox(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: growboxKeys.detail(deletedId) });
      
      // Update list cache
      queryClient.setQueryData(growboxKeys.lists(), (old: Growbox[] = []) =>
        old.filter(box => box.id !== deletedId)
      );
    },
  });
};