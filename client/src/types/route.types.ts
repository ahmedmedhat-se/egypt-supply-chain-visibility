import type { Checkpoint } from './checkpoint.types';

export interface Route {
  id: string;
  name: string;
  code: string;
  originCity: string;
  destinationCity: string;
  estimatedDays: number | null;
  isActive: boolean;
  checkpointCount?: number;
  shipmentCount?: number;
  checkpoints?: RouteCheckpoint[];
}

export interface RouteCheckpoint {
  id: string;
  checkpointId: string;
  sequenceOrder: number;
  checkpoint: Checkpoint;
}

export interface CreateRouteData {
  name: string;
  code: string;
  originCity: string;
  destinationCity: string;
  estimatedDays?: number;
}

export interface UpdateRouteData {
  name?: string;
  code?: string;
  originCity?: string;
  destinationCity?: string;
  estimatedDays?: number;
}

export interface AddRouteCheckpointData {
  checkpointId: string;
  sequenceOrder: number;
}
