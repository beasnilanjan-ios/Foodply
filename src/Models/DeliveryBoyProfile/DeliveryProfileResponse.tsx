import {DeliveryProfileData} from './DeliveryProfileData';

export interface DeliveryProfileResponse {
  success: boolean;
  message: string;
  data: DeliveryProfileData;
}
