import axios from 'axios';
import { CONFIG } from '../config/settings';

interface HAServiceCall {
  domain: string;
  service: string;
  service_data?: any;
}

export class HomeAssistantService {
  private api = axios.create({
    baseURL: CONFIG.HOME_ASSISTANT.URL,
    timeout: CONFIG.HOME_ASSISTANT.TIMEOUT,
    headers: {
      Authorization: `Bearer ${CONFIG.HOME_ASSISTANT.TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  async callService(domain: string, service: string, serviceData?: any) {
    try {
      const response = await this.api.post(`/api/services/${domain}/${service}`, serviceData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Service ${domain}.${service} not found in Home Assistant (404)`);
        return null;
      }
      console.error(`HA Service call failed: ${domain}.${service}`, error.message);
      return null;
    }
  }

  async getState(entityId: string) {
    try {
      const response = await this.api.get(`/api/states/${entityId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Entity ${entityId} not found in Home Assistant (404)`);
        return null;
      }
      console.error(`Failed to get state for ${entityId}:`, error.message);
      return null;
    }
  }

  async getStates() {
    try {
      const response = await this.api.get('/api/states');
      return response.data;
    } catch (error) {
      console.error('Failed to get all states:', error);
      throw error;
    }
  }

  async turnOnLight(entityId: string, brightness?: number, transition?: number) {
    const serviceData: any = { entity_id: entityId };
    if (brightness !== undefined) serviceData.brightness = brightness;
    if (transition !== undefined) serviceData.transition = transition;
    
    return this.callService('light', 'turn_on', serviceData);
  }

  async turnOffLight(entityId: string, transition?: number) {
    const serviceData: any = { entity_id: entityId };
    if (transition !== undefined) serviceData.transition = transition;
    
    return this.callService('light', 'turn_off', serviceData);
  }

  async setFanSpeed(entityId: string, speed: number) {
    return this.callService('fan', 'set_percentage', {
      entity_id: entityId,
      percentage: speed
    });
  }

  async turnOnSwitch(entityId: string) {
    return this.callService('switch', 'turn_on', { entity_id: entityId });
  }

  async turnOffSwitch(entityId: string) {
    return this.callService('switch', 'turn_off', { entity_id: entityId });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/');
      console.log('Home Assistant connection successful');
      return true;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('Home Assistant not reachable (connection refused)');
      } else {
        console.warn('Home Assistant connection test failed:', error.message);
      }
      return false;
    }
  }

  async isEntityAvailable(entityId: string): Promise<boolean> {
    const state = await this.getState(entityId);
    return state !== null && state.state !== 'unavailable';
  }

  calculateVPD(temperature: number, humidity: number): number {
    const saturationVaporPressure = 0.6108 * Math.exp(17.27 * temperature / (temperature + 237.3));
    const vaporPressure = (humidity / 100) * saturationVaporPressure;
    return saturationVaporPressure - vaporPressure;
  }
}

export const haService = new HomeAssistantService();