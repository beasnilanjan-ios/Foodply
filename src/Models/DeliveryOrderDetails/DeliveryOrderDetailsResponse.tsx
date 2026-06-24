import { DeliveryOrderDetails } from './DeliveryOrderDetails';

export interface DeliveryOrderDetailsResponse {
  success: boolean;
  message: string;
  data: DeliveryOrderDetails;
}
