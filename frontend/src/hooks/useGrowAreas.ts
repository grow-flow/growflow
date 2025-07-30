import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { GrowArea } from '../types/models';

// Query Keys
export const growAreaKeys = {
  all: ['grow-areas'] as const,
  lists: () => [...growAreaKeys.all, 'list'] as const,
  list: (filters: string) => [...growAreaKeys.lists(), { filters }] as const,
  details: () => [...growAreaKeys.all, 'detail'] as const,
  detail: (id: number) => [...growAreaKeys.details(), id] as const,
};

// Grow Areas List Query
export const useGrowAreas = () => {
  return useQuery({
    queryKey: growAreaKeys.lists(),
    queryFn: () => apiService.getGrowAreas(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Single Grow Area Query
export const useGrowArea = (id: number) => {
  return useQuery({
    queryKey: growAreaKeys.detail(id),
    queryFn: () => apiService.getGrowArea(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Create Grow Area Mutation
export const useCreateGrowArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<GrowArea>) => apiService.createGrowArea(data),
    onSuccess: (newGrowArea) => {
      // Invalidate and refetch grow areas list
      queryClient.invalidateQueries({ queryKey: growAreaKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData(growAreaKeys.lists(), (old: GrowArea[] = []) => [
        ...old,
        newGrowArea
      ]);
    },
    onError: (error) => {
      console.error('Failed to create grow area:', error);
    },
  });
};

// Update Grow Area Mutation
export const useUpdateGrowArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GrowArea> }) =>
      apiService.updateGrowArea(id, data),
    onSuccess: (updatedGrowArea) => {
      // Update specific grow area in cache
      queryClient.setQueryData(
        growAreaKeys.detail(updatedGrowArea.id),
        updatedGrowArea
      );
      
      // Update in list cache
      queryClient.setQueryData(growAreaKeys.lists(), (old: GrowArea[] = []) =>
        old.map(area => area.id === updatedGrowArea.id ? updatedGrowArea : area)
      );
    },
  });
};

// Delete Grow Area Mutation
export const useDeleteGrowArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteGrowArea(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: growAreaKeys.detail(deletedId) });
      
      // Update list cache
      queryClient.setQueryData(growAreaKeys.lists(), (old: GrowArea[] = []) =>
        old.filter(area => area.id !== deletedId)
      );
    },
  });
};