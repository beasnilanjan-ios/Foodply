import { Vehicle } from './Vehicle'

export interface Agent {
  id: number;
  name: string;
  phone: string;
  profileImageUrl: string,
  isAvailable: boolean;
  vehicle: Vehicle;
}