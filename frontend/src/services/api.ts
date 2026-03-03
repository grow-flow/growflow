import axios from 'axios';
import { Plant, PlantPhase, PlantEvent, CreatePlantRequest, CreateEventRequest, PhasePreset } from '../types/models';
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

const getBasePath = () => {
  const p = window.location.pathname;
  const m = p.match(/^(\/api\/hassio_ingress\/[^\/]+)/);
  return m ? m[1] : '';
};

export const getPhotoUrl = (filename: string) =>
  `${getBasePath()}/api/uploads/files/${filename}`;

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

  createPlant: async (data: CreatePlantRequest): Promise<Plant> => {
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
  updatePlantPhases: async (plantId: number, phases: PlantPhase[]): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/phases`, { phases });
    return response.data;
  },

  updatePhaseStartDate: async (plantId: number, phaseId: number, startDate: string | null): Promise<Plant> => {
    const plant = await apiService.getPlant(plantId);
    const updatedPhases = plant.phases.map(phase =>
      phase.id === phaseId ? { ...phase, startDate: startDate || undefined } : phase
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  startNextPhase: async (plantId: number): Promise<Plant> => {
    const plant = await apiService.getPlant(plantId);
    const phases = plant.phases.sort((a, b) => a.sortOrder - b.sortOrder);

    let currentIdx = -1;
    for (let i = 0; i < phases.length; i++) {
      if (phases[i].startDate) currentIdx = i;
    }
    if (currentIdx === -1 || currentIdx >= phases.length - 1) {
      throw new Error('Cannot start next phase');
    }

    const now = new Date().toISOString();
    const updatedPhases = phases.map((p, i) =>
      i === currentIdx + 1 ? { ...p, startDate: now } : p
    );
    return apiService.updatePlantPhases(plantId, updatedPhases);
  },

  // Events
  createEvent: async (plantId: number, eventData: CreateEventRequest): Promise<Plant> => {
    const response = await api.post(`/plants/${plantId}/events`, eventData);
    return response.data;
  },

  updateEvent: async (plantId: number, eventId: number, eventData: Partial<PlantEvent>): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (plantId: number, eventId: number): Promise<Plant> => {
    const response = await api.delete(`/plants/${plantId}/events/${eventId}`);
    return response.data;
  },

  // Strains
  getStrains: async (): Promise<Strain[]> => {
    const response = await api.get('/strains');
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

  // Presets
  getPresets: async (growType?: string, sourceType?: string): Promise<PhasePreset[]> => {
    const params = new URLSearchParams();
    if (growType) params.set('growType', growType);
    if (sourceType) params.set('sourceType', sourceType);
    const response = await api.get(`/presets?${params}`);
    return response.data;
  },

  // Uploads
  uploadPhotos: async (plantId: number, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    const response = await api.post(`/uploads/${plantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
    return response.data.photos;
  },

  deletePhoto: async (filename: string): Promise<void> => {
    await api.delete(`/uploads/${filename}`);
  },
};
