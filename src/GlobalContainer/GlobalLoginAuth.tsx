import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../Models/Login/User';
class GlobalLoginAuth {
  private static instance: GlobalLoginAuth;

  token: string | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;
  tokenType: string | null = null;
  refreshTokenExpiresAt: string | null = null;
  user: User = undefined as any; // ✅ Initialize as undefined to avoid type issues

  private constructor() {}

  static getInstance(): GlobalLoginAuth {
    if (!GlobalLoginAuth.instance) {
      GlobalLoginAuth.instance = new GlobalLoginAuth();
    }
    return GlobalLoginAuth.instance;
  }

  // ✅ SAVE + SET DATA
  async setAuthData(response: any) {
    const data = response?.data;

    this.token = data?.token || null;
    this.accessToken = data?.accessToken || null;
    this.refreshToken = data?.refreshToken || null;
    this.tokenType = data?.tokenType || null;
    this.refreshTokenExpiresAt = data?.refreshTokenExpiresAt || null;
    this.user = data?.user || undefined as any; // ✅ Initialize as undefined to avoid type issues

    // 🔥 Save to storage
    await AsyncStorage.setItem('authData', JSON.stringify(data));
  }

  // ✅ LOAD DATA (on app start)
  async loadAuthData() {
    try {
      const storedData = await AsyncStorage.getItem('authData');

      if (storedData) {
        const data = JSON.parse(storedData);

        this.token = data?.token || null;
        this.accessToken = data?.accessToken || null;
        this.refreshToken = data?.refreshToken || null;
        this.tokenType = data?.tokenType || null;
        this.refreshTokenExpiresAt = data?.refreshTokenExpiresAt || null;
        this.user = data?.user || undefined as any; // ✅ Initialize as undefined to avoid type issues
      }
    } catch (error) {
      console.log('Error loading auth data:', error);
    }
  }

  // ✅ CLEAR DATA (logout)
  async clear() {
    this.token = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenType = null;
    this.refreshTokenExpiresAt = null;
    this.user = undefined as any; // ✅ Initialize as undefined to avoid type issues

    await AsyncStorage.removeItem('authData');
  }

  getBearerToken(): string | null {
    return this.accessToken || this.token;
  }

  async resolveAuthToken(): Promise<string | null> {
    await this.loadAuthData();
    return this.getBearerToken();
  }

  async getAuthHeaders(
    withBody = false,
  ): Promise<Record<string, string>> {
    await this.loadAuthData();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Client-Type': 'mobile',
    };

    if (withBody) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getBearerToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }
}

export default GlobalLoginAuth.getInstance();