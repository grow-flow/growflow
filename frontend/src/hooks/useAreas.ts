import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import {
  GrowArea, AreaEvent, CreateAreaRequest, CreateAreaEventRequest,
} from "../types/models";
import { plantKeys } from "./usePlants";

export const areaKeys = {
  all: ["areas"] as const,
  lists: () => [...areaKeys.all, "list"] as const,
  details: () => [...areaKeys.all, "detail"] as const,
  detail: (id: number) => [...areaKeys.details(), id] as const,
  events: (id: number) => [...areaKeys.detail(id), "events"] as const,
};

export const useAreas = () => {
  return useQuery({
    queryKey: areaKeys.lists(),
    queryFn: () => apiService.getAreas(),
    staleTime: 1 * 60 * 1000,
  });
};

export const useArea = (id: number | undefined) => {
  return useQuery({
    queryKey: areaKeys.detail(id as number),
    queryFn: () => apiService.getArea(id as number),
    enabled: !!id,
  });
};

export const useCreateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAreaRequest) => apiService.createArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
};

export const useUpdateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GrowArea> }) =>
      apiService.updateArea(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(areaKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
};

export const useDeleteArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteArea(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.removeQueries({ queryKey: areaKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
};

export const useCreateAreaEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, data }: { areaId: number; data: CreateAreaEventRequest }) =>
      apiService.createAreaEvent(areaId, data),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.events(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
};

export const useUpdateAreaEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, eventId, data }: { areaId: number; eventId: number; data: Partial<AreaEvent> }) =>
      apiService.updateAreaEvent(areaId, eventId, data),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.events(areaId) });
    },
  });
};

export const useDeleteAreaEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, eventId }: { areaId: number; eventId: number }) =>
      apiService.deleteAreaEvent(areaId, eventId),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.events(areaId) });
    },
  });
};

export const useAssignPlantToArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, plantId }: { areaId: number; plantId: number }) =>
      apiService.assignPlantToArea(areaId, plantId),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
};

export const useRemovePlantFromArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, plantId }: { areaId: number; plantId: number }) =>
      apiService.removePlantFromArea(areaId, plantId),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
};

export const useFlipArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, newSchedule, transitionPlants, timestamp }: {
      areaId: number;
      newSchedule: string;
      transitionPlants?: boolean;
      timestamp?: string;
    }) => apiService.flipArea(areaId, { newSchedule, transitionPlants, timestamp }),
    onSuccess: (_, { areaId }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
};
