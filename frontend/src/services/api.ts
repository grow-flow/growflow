import axios from 'axios';
import { GrowArea, Plant, WateringLog, FeedingLog, ObservationLog } from '../types/models';
import { Strain, CreateStrainData, UpdateStrainData } from '../types/strain';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const apiService = {
  // Grow Area endpoints
  getGrowAreas: async (): Promise<GrowArea[]> => {
    const response = await api.get('/grow-areas');
    return response.data;
  },

  getGrowArea: async (id: number): Promise<GrowArea> => {
    const response = await api.get(`/grow-areas/${id}`);
    return response.data;
  },

  createGrowArea: async (data: Partial<GrowArea>): Promise<GrowArea> => {
    const response = await api.post('/grow-areas', data);
    return response.data;
  },

  updateGrowArea: async (id: number, data: Partial<GrowArea>): Promise<GrowArea> => {
    const response = await api.put(`/grow-areas/${id}`, data);
    return response.data;
  },

  deleteGrowArea: async (id: number): Promise<void> => {
    await api.delete(`/grow-areas/${id}`);
  },

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

  // Phase management endpoints
  updatePhaseStartDate: async (plantId: number, phaseId: string, startDate: string | null): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/phase/${phaseId}/start-date`, { startDate });
    return response.data;
  },

  startNextPhase: async (plantId: number): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/start-next-phase`);
    return response.data;
  },
};