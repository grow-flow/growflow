import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { Strain, CreateStrainData, UpdateStrainData } from "../types/strain";

export const useStrains = () => {
  return useQuery({
    queryKey: ["strains"],
    queryFn: () => apiService.getStrains(),
    initialData: [],
  });
};

export const useStrain = (id: number) => {
  return useQuery({
    queryKey: ["strain", id],
    queryFn: () => apiService.getStrain(id),
    enabled: !!id,
  });
};

export const useCreateStrain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrainData) => apiService.createStrain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strains"] });
    },
  });
};

export const useUpdateStrain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<UpdateStrainData>;
    }) => apiService.updateStrain(id, data),
    onSuccess: (updatedStrain) => {
      queryClient.setQueryData(["strain", updatedStrain.id], updatedStrain);
      queryClient.invalidateQueries({ queryKey: ["strains"] });
    },
  });
};

export const useDeleteStrain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteStrain(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ["strain", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["strains"] });
    },
  });
};
