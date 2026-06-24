import { LatestLocation } from './LatestLocation';

export interface Delivery {
  status: string;
  estimatedDeliveryMinutes: number;
  estimatedDeliveryWindow: string;
  distanceKm: number;
  latestLocation: LatestLocation;
}
