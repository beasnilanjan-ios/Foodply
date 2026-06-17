import { SendOtpData } from './SendOtpData';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data: SendOtpData;
}
