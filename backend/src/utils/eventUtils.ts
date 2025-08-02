import { PlantEvent, EVENT_TYPES } from '../models/Event';
import { v4 as uuidv4 } from 'uuid';

export const createEvent = (
  type: PlantEvent['type'],
  title: string,
  data?: PlantEvent['data'],
  notes?: string,
  phaseId?: string
): PlantEvent => ({
  id: uuidv4(),
  timestamp: new Date().toISOString(),
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

export const getEventsByType = (
  events: PlantEvent[],
  type: PlantEvent['type']
): PlantEvent[] => {
  return events.filter(event => event.type === type);
};

export const getEventsByPhase = (
  events: PlantEvent[],
  phaseId: string
): PlantEvent[] => {
  return events.filter(event => event.phase_id === phaseId);
};

export const getEventsInDateRange = (
  events: PlantEvent[],
  startDate: Date,
  endDate: Date
): PlantEvent[] => {
  return events.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

export const getEventStats = (events: PlantEvent[]) => {
  const stats = {
    total: events.length,
    byType: {} as Record<string, number>,
    thisWeek: 0,
    thisMonth: 0
  };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  events.forEach(event => {
    // Count by type
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

    // Count by time period
    const eventDate = new Date(event.timestamp);
    if (eventDate >= weekAgo) stats.thisWeek++;
    if (eventDate >= monthAgo) stats.thisMonth++;
  });

  return stats;
};

export const getLastEventOfType = (
  events: PlantEvent[],
  type: PlantEvent['type']
): PlantEvent | null => {
  const eventsOfType = getEventsByType(events, type);
  return eventsOfType.length > 0 ? eventsOfType[0] : null;
};

export const getDaysSinceLastEvent = (
  events: PlantEvent[],
  type: PlantEvent['type']
): number | null => {
  const lastEvent = getLastEventOfType(events, type);
  if (!lastEvent) return null;

  const daysDiff = Math.floor(
    (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysDiff;
};

export const getEventIcon = (type: PlantEvent['type']): string => {
  return EVENT_TYPES[type]?.icon || '📝';
};

export const getEventColor = (type: PlantEvent['type']): string => {
  return EVENT_TYPES[type]?.color || '#616161';
};