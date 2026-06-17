import { DashboardData } from './DashboardData';

export interface DeliveryDashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}