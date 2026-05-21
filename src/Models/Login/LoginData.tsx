import { User } from '../Login/User';

export interface LoginData {
  token: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  refreshTokenExpiresAt: string;
  user: User;
}