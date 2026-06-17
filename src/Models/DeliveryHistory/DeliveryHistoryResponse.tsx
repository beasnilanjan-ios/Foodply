import { DeliveryHistoryData } from './DeliveryHistoryData';

export interface DeliveryHistoryResponse {
  success: boolean;
  message: string;
  data: DeliveryHistoryData;
}