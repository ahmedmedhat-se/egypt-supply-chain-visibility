export type CheckpointType =
  | 'port'
  | 'customs'
  | 'warehouse'
  | 'hub'
  | 'border'
  | 'depot';

export interface Checkpoint {
  id: string;
  name: string;
  code: string;
  type: CheckpointType;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface CreateCheckpointData {
  name: string;
  code: string;
  type: CheckpointType;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateCheckpointData {
  name?: string;
  code?: string;
  type?: CheckpointType;
  city?: string;
  latitude?: number;
  longitude?: number;
}
