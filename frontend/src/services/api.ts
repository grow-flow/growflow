import axios from 'axios';
import { Growbox, Plant, WateringLog, FeedingLog, ObservationLog } from '../types/models';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const apiService = {
  // Growbox endpoints
  getGrowboxes: async (): Promise<Growbox[]> => {
    const response = await api.get('/growboxes');
    return response.data;
  },

  getGrowbox: async (id: number): Promise<Growbox> => {
    const response = await api.get(`/growboxes/${id}`);
    return response.data;
  },

  createGrowbox: async (data: Partial<Growbox>): Promise<Growbox> => {
    const response = await api.post('/growboxes', data);
    return response.data;
  },

  updateGrowbox: async (id: number, data: Partial<Growbox>): Promise<Growbox> => {
    const response = await api.put(`/growboxes/${id}`, data);
    return response.data;
  },

  deleteGrowbox: async (id: number): Promise<void> => {
    await api.delete(`/growboxes/${id}`);
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
};