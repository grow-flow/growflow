import axios from 'axios';
import { Plant, PlantPhaseInstance, PlantEvent } from '../types/models';
import { Strain, CreateStrainData, UpdateStrainData } from '../types/strain';

const api = axios.create({
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const path = window.location.pathname;
  const ingressMatch = path.match(/^(\/api\/hassio_ingress\/[^\/]+)/);
  const basePath = ingressMatch ? ingressMatch[1] : '';
  if (config.url && !config.url.startsWith('http')) {
    config.url = `${basePath}/api${config.url}`;
  }
  return config;
});

export const apiService = {
  // Plants
  getPlants: async (): Promise<Plant[]> => {
    const response = await api.get('/plants');
    return response.data;
  },

  getPlant: async (id: number): Promise<Plant> => {
    const response = await api.get(`/plants/${id}`);
    return response.data;
  },

  createPlant: async (data: Partial<Plant>): Promise<Plant> => {
    const response = await api.post('/plants', data);
    return response.data;
  },

  updatePlant: async (id: number, data: Partial<Plant>): Promise<Plant> => {
    const response = await api.put(`/plants/${id}`, data);
    return response.data;
  },

  deletePlant: async (id: number): Promise<void> => {
    await api.delete(`/plants/${id}`);
  },

  // Phases
  updatePlantPhases: async (plantId: number, phases: PlantPhaseInstance[]): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/phases`, { phases });
    return response.data;
  },

  updatePhaseStartDate: async (plantId: number, phaseId: string, startDate: string | null): Promise<Plant> => {
    const plant = await apiService.getPlant(plantId);
    const updatedPhases = plant.phases.map(phase =>
      phase.id === phaseId ? { ...phase, start_date: startDate || undefined } : phase
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  startNextPhase: async (plantId: number): Promise<Plant> => {
    const plant = await apiService.getPlant(plantId);
    let currentIdx = -1;
    for (let i = 0; i < plant.phases.length; i++) {
      if (plant.phases[i].start_date) currentIdx = i;
    }
    if (currentIdx === -1 || currentIdx >= plant.phases.length - 1) {
      throw new Error('Cannot start next phase');
    }
    const updatedPhases = plant.phases.map((phase, i) =>
      i === currentIdx + 1 ? { ...phase, start_date: new Date().toISOString() } : phase
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  // Events
  createEvent: async (plantId: number, eventData: {
    type: PlantEvent['type'];
    title: string;
    data?: PlantEvent['data'];
    notes?: string;
    timestamp?: string;
  }): Promise<Plant> => {
    const response = await api.post(`/plants/${plantId}/events`, eventData);
    return response.data;
  },

  updateEvent: async (plantId: number, eventId: string, eventData: Partial<PlantEvent>): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (plantId: number, eventId: string): Promise<Plant> => {
    const response = await api.delete(`/plants/${plantId}/events/${eventId}`);
    return response.data;
  },

  // Strains
  getStrains: async (): Promise<Strain[]> => {
    const response = await api.get('/strains');
    return response.data;
  },

  getStrain: async (id: number): Promise<Strain> => {
    const response = await api.get(`/strains/${id}`);
    return response.data;
  },

  createStrain: async (data: CreateStrainData): Promise<Strain> => {
    const response = await api.post('/strains', data);
    return response.data;
  },

  updateStrain: async (id: number, data: Partial<UpdateStrainData>): Promise<Strain> => {
    const response = await api.put(`/strains/${id}`, data);
    return response.data;
  },

  deleteStrain: async (id: number): Promise<void> => {
    await api.delete(`/strains/${id}`);
  },
};
