import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { Plant, PlantEvent } from "../types/models";

export const plantKeys = {
  all: ["plants"] as const,
  lists: () => [...plantKeys.all, "list"] as const,
  details: () => [...plantKeys.all, "detail"] as const,
  detail: (id: number) => [...plantKeys.details(), id] as const,
};

export const usePlants = () => {
  return useQuery({
    queryKey: plantKeys.lists(),
    queryFn: () => apiService.getPlants(),
    staleTime: 1 * 60 * 1000,
  });
};

export const usePlant = (id: number) => {
  return useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => apiService.getPlant(id),
    enabled: !!id,
  });
};

export const useCreatePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Plant>) => apiService.createPlant(data),
    onSuccess: (newPlant) => {
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() });
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) => [...old, newPlant]);
    },
  });
};

export const useUpdatePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Plant> }) => apiService.updatePlant(id, data),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
      );
      queryClient.invalidateQueries({ queryKey: plantKeys.detail(updatedPlant.id) });
    },
  });
};

export const useDeletePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deletePlant(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.filter((p) => p.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() });
      queryClient.removeQueries({ queryKey: plantKeys.detail(deletedId) });
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plantId, eventData }: {
      plantId: number;
      eventData: { type: PlantEvent["type"]; title: string; data?: PlantEvent["data"]; notes?: string; timestamp?: string };
    }) => apiService.createEvent(plantId, eventData),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
      );
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plantId, eventId, eventData }: { plantId: number; eventId: string; eventData: Partial<PlantEvent> }) =>
      apiService.updateEvent(plantId, eventId, eventData),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
      );
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plantId, eventId }: { plantId: number; eventId: string }) =>
      apiService.deleteEvent(plantId, eventId),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
      );
    },
  });
};
