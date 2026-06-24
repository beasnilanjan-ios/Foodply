import {DeliveryTrackingData} from '../CustomerTrackOrder/DeliveryTrackingData'

export interface DeliveryTrackingResponse {
  success: boolean;
  message: string;
  data: DeliveryTrackingData;
}
