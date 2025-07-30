import * as cron from 'node-cron';
import { CONFIG } from '../config/settings';
import { AppDataSource } from '../database';
import { GrowArea, Plant, EnvironmentLog, PlantPhase } from '../models';
import { haService } from './homeAssistantService';
import { mqttService } from './mqttService';

export class AutomationService {
  private tasks: cron.ScheduledTask[] = [];
  private isRunning = false;

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Starting automation service...');

    // Test HA connection on startup
    const haConnected = await haService.testConnection();
    if (!haConnected) {
      console.log('Automation service started in limited mode - Home Assistant not available');
    }

    // VPD monitoring and control
    const vpdTask = cron.schedule('*/1 * * * *', () => {
      this.checkVPDAutomation();
    }, { scheduled: false });

    // Light schedule automation
    const lightTask = cron.schedule('*/30 * * * * *', () => {
      this.checkLightSchedules();
    }, { scheduled: false });

    // Environment data collection
    const envTask = cron.schedule('*/30 * * * * *', () => {
      this.collectEnvironmentData();
    }, { scheduled: false });

    this.tasks = [vpdTask, lightTask, envTask];
    this.tasks.forEach(task => task.start());

    console.log('Automation service started');
  }

  stop() {
    if (!this.isRunning) return;

    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    this.isRunning = false;

    console.log('Automation service stopped');
  }

  private async checkVPDAutomation() {
    try {
      const growAreas = await AppDataSource.getRepository(GrowArea).find({
        where: { automation_enabled: true },
        relations: ['plants']
      });

      for (const growArea of growAreas) {
        await this.processGrowAreaVPD(growArea);
      }
    } catch (error) {
      console.error('VPD automation error:', error);
    }
  }

  private async processGrowAreaVPD(growArea: GrowArea) {
    try {
      // Get current environment data
      const tempState = await haService.getState(growArea.sensors.temperature);
      const humidityState = await haService.getState(growArea.sensors.humidity);

      if (!tempState || !humidityState) return;

      const temperature = parseFloat(tempState.state);
      const humidity = parseFloat(humidityState.state);
      const currentVPD = haService.calculateVPD(temperature, humidity);

      // Determine target VPD based on plants in grow area
      const targetVPD = this.calculateTargetVPD(growArea);
      
      // Log environment data
      await this.logEnvironmentData(growArea.id, temperature, humidity, currentVPD);

      // Publish to MQTT
      mqttService.publishGrowAreaData(growArea.id, {
        temperature,
        humidity,
        vpd: currentVPD
      });

      // Control equipment based on VPD
      if (Math.abs(currentVPD - targetVPD) > 0.1) {
        await this.adjustVPD(growArea, currentVPD, targetVPD, temperature, humidity);
      }
    } catch (error) {
      console.error(`VPD processing error for grow area ${growArea.id}:`, error);
    }
  }

  private calculateTargetVPD(growArea: GrowArea): number {
    const activePlants = growArea.plants?.filter(p => p.is_active) || [];
    
    if (activePlants.length === 0) {
      return growArea.target_vpd_by_phase.vegetation;
    }

    // Use the most restrictive (lowest) VPD target if multiple plants in different phases
    const phases = activePlants.map(p => p.current_phase);
    const vpdTargets = phases.map(phase => {
      switch (phase) {
        case PlantPhase.GERMINATION:
          return growArea.target_vpd_by_phase.germination;
        case PlantPhase.SEEDLING:
          return growArea.target_vpd_by_phase.seedling;
        case PlantPhase.VEGETATION:
        case PlantPhase.PRE_FLOWER:
          return growArea.target_vpd_by_phase.vegetation;
        case PlantPhase.FLOWERING:
        case PlantPhase.FLUSHING:
          return growArea.target_vpd_by_phase.flowering;
        default:
          return growArea.target_vpd_by_phase.vegetation;
      }
    });

    return Math.min(...vpdTargets);
  }

  private async adjustVPD(growArea: GrowArea, currentVPD: number, targetVPD: number, temperature: number, humidity: number) {
    const vpdDiff = currentVPD - targetVPD;

    if (vpdDiff > 0.1) {
      // VPD too high - increase humidity or decrease temperature
      if (growArea.equipment.humidifier) {
        await haService.turnOnSwitch(growArea.equipment.humidifier);
      }
    } else if (vpdDiff < -0.1) {
      // VPD too low - decrease humidity or increase temperature
      if (growArea.equipment.dehumidifier) {
        await haService.turnOnSwitch(growArea.equipment.dehumidifier);
      }
      if (growArea.equipment.humidifier) {
        await haService.turnOffSwitch(growArea.equipment.humidifier);
      }
    }
  }

  private async checkLightSchedules() {
    try {
      const plants = await AppDataSource.getRepository(Plant).find({
        where: { is_active: true },
        relations: ['grow_area']
      });

      for (const plant of plants) {
        await this.processPlantLightSchedule(plant);
      }
    } catch (error) {
      console.error('Light schedule error:', error);
    }
  }

  private async processPlantLightSchedule(plant: Plant) {
    const schedule = this.getCurrentLightSchedule(plant);
    if (!schedule) return;

    const now = new Date();
    const shouldLightsBeOn = this.shouldLightsBeOn(schedule, now);

    for (const lightEntity of plant.grow_area.equipment.lights) {
      try {
        const currentState = await haService.getState(lightEntity);
        const isCurrentlyOn = currentState.state === 'on';

        if (shouldLightsBeOn && !isCurrentlyOn) {
          await haService.turnOnLight(lightEntity, 255, 300);
        } else if (!shouldLightsBeOn && isCurrentlyOn) {
          await haService.turnOffLight(lightEntity, 300);
        }
      } catch (error) {
        console.error(`Light control error for ${lightEntity}:`, error);
      }
    }
  }

  private getCurrentLightSchedule(plant: Plant): string {
    if (plant.current_phase === PlantPhase.FLOWERING || plant.current_phase === PlantPhase.FLUSHING) {
      return plant.light_schedule.flowering;
    }
    return plant.light_schedule.vegetation;
  }

  private shouldLightsBeOn(schedule: string, now: Date): boolean {
    const [hoursOn, hoursOff] = schedule.split('/').map(h => parseInt(h));
    const currentHour = now.getHours();
    
    // Simple implementation: lights on from midnight for specified hours
    return currentHour < hoursOn;
  }

  private async collectEnvironmentData() {
    try {
      const growAreas = await AppDataSource.getRepository(GrowArea).find();

      for (const growArea of growAreas) {
        try {
          // Skip if no sensors configured
          if (!growArea.sensors?.temperature || !growArea.sensors?.humidity) {
            console.log(`Skipping environment data collection for grow area ${growArea.id} - no sensors configured`);
            continue;
          }

          // Test HA connection first
          const isConnected = await haService.testConnection();
          if (!isConnected) {
            console.log(`Skipping environment data collection for grow area ${growArea.id} - HA not available`);
            continue;
          }

          // Check if entities exist and are available
          const tempAvailable = await haService.isEntityAvailable(growArea.sensors.temperature);
          const humidityAvailable = await haService.isEntityAvailable(growArea.sensors.humidity);

          if (!tempAvailable || !humidityAvailable) {
            console.log(`Skipping environment data collection for grow area ${growArea.id} - sensors not available (temp: ${tempAvailable}, humidity: ${humidityAvailable})`);
            continue;
          }

          const tempState = await haService.getState(growArea.sensors.temperature);
          const humidityState = await haService.getState(growArea.sensors.humidity);

          if (tempState && humidityState) {
            const temperature = parseFloat(tempState.state);
            const humidity = parseFloat(humidityState.state);
            
            // Validate sensor values
            if (isNaN(temperature) || isNaN(humidity) || temperature < -50 || temperature > 100 || humidity < 0 || humidity > 100) {
              console.warn(`Invalid sensor data for grow area ${growArea.id}: temp=${temperature}, humidity=${humidity}`);
              continue;
            }

            const vpd = haService.calculateVPD(temperature, humidity);

            await this.logEnvironmentData(growArea.id, temperature, humidity, vpd);
            
            mqttService.publishGrowAreaData(growArea.id, {
              temperature,
              humidity,
              vpd
            });
          }
        } catch (error: any) {
          console.warn(`Environment data collection error for grow area ${growArea.id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Environment data collection error:', error);
    }
  }

  private async logEnvironmentData(growAreaId: number, temperature: number, humidity: number, vpd: number) {
    try {
      const envLogRepo = AppDataSource.getRepository(EnvironmentLog);
      const log = envLogRepo.create({
        grow_area_id: growAreaId,
        temperature,
        humidity,
        vpd_calculated: vpd,
        timestamp: new Date()
      });
      await envLogRepo.save(log);
    } catch (error) {
      console.error('Environment logging error:', error);
    }
  }
}

export const automationService = new AutomationService();