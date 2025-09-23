import axios from 'axios';
import { Plant, WateringLog, FeedingLog, ObservationLog, PlantPhaseInstance, PlantEvent } from '../types/models';
import { Strain, CreateStrainData, UpdateStrainData } from '../types/strain';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const apiService = {

  // Plant endpoints
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

  updatePlantPhase: async (id: number, phase: string): Promise<Plant> => {
    const response = await api.put(`/plants/${id}/phase`, { phase });
    return response.data;
  },

  deletePlant: async (id: number): Promise<void> => {
    await api.delete(`/plants/${id}`);
  },

  // Care endpoints
  logWatering: async (data: Partial<WateringLog>): Promise<WateringLog> => {
    const response = await api.post('/care/water', data);
    return response.data;
  },

  logFeeding: async (data: Partial<FeedingLog>): Promise<FeedingLog> => {
    const response = await api.post('/care/feed', data);
    return response.data;
  },

  logObservation: async (data: Partial<ObservationLog>): Promise<ObservationLog> => {
    const response = await api.post('/care/observation', data);
    return response.data;
  },

  getCareHistory: async (plantId: number) => {
    const response = await api.get(`/care/${plantId}/history`);
    return response.data;
  },

  // Strain endpoints
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

  // Unified phase management endpoint
  updatePlantPhases: async (plantId: number, phases: PlantPhaseInstance[]): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/phases`, { phases });
    return response.data;
  },

  // Helper methods that manipulate phases array and call unified endpoint
  updatePhaseStartDate: async (plantId: number, phaseId: string, startDate: string | null): Promise<Plant> => {
    // Get current plant data
    const plant = await apiService.getPlant(plantId);
    // Update the specific phase date
    const updatedPhases = plant.phases.map(phase => 
      phase.id === phaseId 
        ? { ...phase, start_date: startDate || undefined }
        : phase
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  startNextPhase: async (plantId: number): Promise<Plant> => {
    // Get current plant data
    const plant = await apiService.getPlant(plantId);
    // Find current phase (last phase with start_date)
    let currentPhaseIndex = -1;
    for (let i = 0; i < plant.phases.length; i++) {
      if (plant.phases[i].start_date) {
        currentPhaseIndex = i;
      }
    }
    
    if (currentPhaseIndex === -1 || currentPhaseIndex >= plant.phases.length - 1) {
      throw new Error('Cannot start next phase');
    }
    
    // Start the next phase by setting its start_date
    const updatedPhases = plant.phases.map((phase, index) => 
      index === currentPhaseIndex + 1
        ? { ...phase, start_date: new Date().toISOString() }
        : phase
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  // Event endpoints
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
};