import { PhaseTemplate } from './models';

export interface Strain {
  id: number;
  name: string;
  abbreviation?: string; // max 4 chars for short labels like "WW", "GG", "AK"
  type: 'indica' | 'sativa' | 'hybrid' | 'autoflowering';
  is_autoflower: boolean;
  flowering_time_min: number; // days
  flowering_time_max: number; // days
  description?: string;
  breeder?: string;
  thc_content?: number; // percentage
  cbd_content?: number; // percentage
  created_at: Date;
  updated_at: Date;
  
  // Phase templates
  phase_templates: PhaseTemplate[];
}

export interface CreateStrainData {
  name: string;
  abbreviation?: string;
  type: 'indica' | 'sativa' | 'hybrid' | 'autoflowering';
  is_autoflower: boolean;
  flowering_time_min: number;
  flowering_time_max: number;
  description?: string;
  breeder?: string;
  thc_content?: number;
  cbd_content?: number;
  phase_templates?: PhaseTemplate[];
}

export interface UpdateStrainData extends Partial<CreateStrainData> {
  id: number;
}

export const DEFAULT_PHASE_TEMPLATES = {
  photoperiod: [
    { name: 'Germination', duration_min: 5, duration_max: 10, description: 'Seeds sprouting and developing first roots', automation_settings: { vpd_target: 0.8 } },
    { name: 'Seedling', duration_min: 10, duration_max: 21, description: 'First leaves developing, plant establishing', automation_settings: { light_schedule: '18/6', vpd_target: 0.9 } },
    { name: 'Vegetation', duration_min: 21, duration_max: 60, description: 'Rapid growth phase, developing strong structure', automation_settings: { light_schedule: '18/6', vpd_target: 1.0 } },
    { name: 'Pre-Flower', duration_min: 7, duration_max: 14, description: 'Transition phase, showing first signs of flowering', automation_settings: { light_schedule: '12/12', vpd_target: 1.1 } },
    { name: 'Flowering', duration_min: 49, duration_max: 77, description: 'Producing buds, main flowering period', automation_settings: { light_schedule: '12/12', vpd_target: 1.2 } },
    { name: 'Flushing', duration_min: 7, duration_max: 21, description: 'Final weeks, removing nutrients for better taste', automation_settings: { light_schedule: '12/12', vpd_target: 1.1 } },
    { name: 'Drying', duration_min: 7, duration_max: 14, description: 'Drying buds in controlled environment', automation_settings: { vpd_target: 0.6 } },
    { name: 'Curing', duration_min: 14, duration_max: 60, description: 'Final curing process for optimal quality' }
  ] as PhaseTemplate[],
  autoflower: [
    { name: 'Germination', duration_min: 5, duration_max: 10, description: 'Seeds sprouting and developing first roots', automation_settings: { light_schedule: '20/4', vpd_target: 0.8 } },
    { name: 'Seedling', duration_min: 7, duration_max: 14, description: 'First leaves developing, plant establishing', automation_settings: { light_schedule: '20/4', vpd_target: 0.9 } },
    { name: 'Vegetation', duration_min: 14, duration_max: 28, description: 'Rapid growth phase, developing strong structure', automation_settings: { light_schedule: '20/4', vpd_target: 1.0 } },
    { name: 'Flowering', duration_min: 35, duration_max: 49, description: 'Auto-flowering phase, producing buds', automation_settings: { light_schedule: '20/4', vpd_target: 1.2 } },
    { name: 'Flushing', duration_min: 7, duration_max: 14, description: 'Final weeks, removing nutrients for better taste', automation_settings: { light_schedule: '20/4', vpd_target: 1.1 } },
    { name: 'Drying', duration_min: 7, duration_max: 14, description: 'Drying buds in controlled environment', automation_settings: { vpd_target: 0.6 } },
    { name: 'Curing', duration_min: 14, duration_max: 60, description: 'Final curing process for optimal quality' }
  ] as PhaseTemplate[]
};