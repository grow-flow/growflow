export interface PlantEventCreateInput {
  plantId: number;
  phaseId: number | null;
  type: string;
  title: string;
  timestamp: Date;
  notes: string | null;
  data: string | null;
}

export const createEventInput = (
  plantId: number,
  type: string,
  title: string,
  data?: any,
  notes?: string,
  phaseId?: number | null,
  timestamp?: string | Date
): PlantEventCreateInput => ({
  plantId,
  phaseId: phaseId ?? null,
  type,
  title,
  timestamp: timestamp ? new Date(timestamp) : new Date(),
  notes: notes || null,
  data: data ? JSON.stringify(data) : null,
});
