export interface Strain {
  id: number;
  name: string;
  abbreviation?: string;
  type: 'autoflower' | 'photoperiod';
  description?: string;
  breeder?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStrainData {
  name: string;
  abbreviation?: string;
  type: 'autoflower' | 'photoperiod';
  description?: string;
  breeder?: string;
}

export interface UpdateStrainData extends Partial<CreateStrainData> {
  id: number;
}

export type StartMethod = 'seed' | 'clone';
