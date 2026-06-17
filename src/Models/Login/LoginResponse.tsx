import { LoginData } from './LoginData';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
}