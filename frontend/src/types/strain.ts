export interface Strain {
  id: number;
  name: string;
  type: 'autoflower' | 'photoperiod';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrainData {
  name: string;
  type: 'autoflower' | 'photoperiod';
}

export interface UpdateStrainData extends Partial<CreateStrainData> {
  id: number;
}
