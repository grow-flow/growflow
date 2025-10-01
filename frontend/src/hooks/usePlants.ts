import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import {
  Plant,
  WateringLog,
  FeedingLog,
  ObservationLog,
  PlantEvent,
} from "../types/models";

// Query Keys
export const plantKeys = {
  all: ["plants"] as const,
  lists: () => [...plantKeys.all, "list"] as const,
  list: (filters: string) => [...plantKeys.lists(), { filters }] as const,
  details: () => [...plantKeys.all, "detail"] as const,
  detail: (id: number) => [...plantKeys.details(), id] as const,
  careHistory: (id: number) => [...plantKeys.detail(id), "care"] as const,
};

// Plants List Query
export const usePlants = () => {
  return useQuery({
    queryKey: plantKeys.lists(),
    queryFn: () => apiService.getPlants(),
    initialData: [],
  });
};

// Single Plant Query
export const usePlant = (id: number) => {
  return useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => apiService.getPlant(id),
    enabled: !!id,
  });
};

// Plant Care History Query
export const usePlantCareHistory = (plantId: number) => {
  return useQuery({
    queryKey: plantKeys.careHistory(plantId),
    queryFn: () => apiService.getCareHistory(plantId),
    enabled: !!plantId,
  });
};

// Create Plant Mutation
export const useCreatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Plant>) => apiService.createPlant(data),
    onSuccess: (newPlant) => {
      // Invalidate plants list
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() });

      // Add to plants list cache
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) => [
        ...old,
        newPlant,
      ]);
    },
  });
};

// Update Plant Mutation
export const useUpdatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Plant> }) =>
      apiService.updatePlant(id, data),
    onSuccess: (updatedPlant) => {
      // Update plant in cache
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);

      // Update in list
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((plant) =>
          plant.id === updatedPlant.id ? updatedPlant : plant
        )
      );

      // Force refresh of plant detail
      queryClient.invalidateQueries({
        queryKey: plantKeys.detail(updatedPlant.id),
      });
    },
  });
};

// Update Plant Phase Mutation
export const useUpdatePlantPhase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: string }) =>
      apiService.updatePlantPhase(id, phase),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);

      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((plant) =>
          plant.id === updatedPlant.id ? updatedPlant : plant
        )
      );
    },
  });
};

// Delete Plant Mutation
export const useDeletePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deletePlant(id),
    onSuccess: (_, deletedId) => {
      // Remove from plants list cache
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.filter((plant) => plant.id !== deletedId)
      );

      // Invalidate plants list to ensure consistency
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() });

      // Remove plant detail from cache
      queryClient.removeQueries({ queryKey: plantKeys.detail(deletedId) });

      // Remove care history from cache
      queryClient.removeQueries({ queryKey: plantKeys.careHistory(deletedId) });
    },
  });
};

// Watering Mutation
export const useLogWatering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WateringLog>) => apiService.logWatering(data),
    onSuccess: (_, variables) => {
      // Invalidate care history for this plant
      if (variables.plant_id) {
        queryClient.invalidateQueries({
          queryKey: plantKeys.careHistory(variables.plant_id),
        });
      }
    },
  });
};

// Feeding Mutation
export const useLogFeeding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<FeedingLog>) => apiService.logFeeding(data),
    onSuccess: (_, variables) => {
      if (variables.plant_id) {
        queryClient.invalidateQueries({
          queryKey: plantKeys.careHistory(variables.plant_id),
        });
      }
    },
  });
};

// Observation Mutation
export const useLogObservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ObservationLog>) =>
      apiService.logObservation(data),
    onSuccess: (_, variables) => {
      if (variables.plant_id) {
        queryClient.invalidateQueries({
          queryKey: plantKeys.careHistory(variables.plant_id),
        });
      }
    },
  });
};

// Event Mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantId,
      eventData,
    }: {
      plantId: number;
      eventData: {
        type: PlantEvent["type"];
        title: string;
        data?: PlantEvent["data"];
        notes?: string;
        timestamp?: string;
      };
    }) => apiService.createEvent(plantId, eventData),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((plant) =>
          plant.id === updatedPlant.id ? updatedPlant : plant
        )
      );
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantId,
      eventId,
      eventData,
    }: {
      plantId: number;
      eventId: string;
      eventData: Partial<PlantEvent>;
    }) => apiService.updateEvent(plantId, eventId, eventData),
    onSuccess: (updatedPlant) => {
      queryClient.setQueryData(plantKeys.detail(updatedPlant.id), updatedPlant);
      queryClient.setQueryData(plantKeys.lists(), (old: Plant[] = []) =>
        old.map((plant) =>
          plant.id === updatedPlant.id ? updatedPlant : plant
        )
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
        old.map((plant) =>
          plant.id === updatedPlant.id ? updatedPlant : plant
        )
      );
    },
  });
};
