import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      await SecureStore.setItemAsync(TOKEN_KEY, data.data.accessToken);
      if (data.data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.data.refreshToken);
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    let response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 by attempting token refresh
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry request with new token
        const newHeaders = await this.getAuthHeaders();
        response = await fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
      } else {
        // Refresh failed, clear tokens
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async uploadFile<T>(endpoint: string, file: FormData): Promise<T> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
