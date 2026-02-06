import { PlantEvent } from '../types/event';
import { v4 as uuidv4 } from 'uuid';

export const createEvent = (
  type: PlantEvent['type'],
  title: string,
  data?: PlantEvent['data'],
  notes?: string,
  phaseId?: string,
  timestamp?: string
): PlantEvent => ({
  id: uuidv4(),
  timestamp: timestamp || new Date().toISOString(),
  type,
  title,
  data,
  notes,
  phase_id: phaseId
});

export const addEventToPlant = (
  events: PlantEvent[],
  newEvent: PlantEvent
): PlantEvent[] => {
  return [...events, newEvent].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const updateEvent = (
  events: PlantEvent[],
  eventId: string,
  updates: Partial<PlantEvent>
): PlantEvent[] => {
  return events.map(event =>
    event.id === eventId ? { ...event, ...updates } : event
  );
};

export const deleteEvent = (
  events: PlantEvent[],
  eventId: string
): PlantEvent[] => {
  return events.filter(event => event.id !== eventId);
};