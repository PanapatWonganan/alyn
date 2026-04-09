import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  penName?: string;
  role: string;
  coinBalance: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        // Validate token by fetching user profile
        const response = await apiClient.get<{ data: { user: User } }>('/users/me');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{
        data: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
      }>('/v1/auth/token', { email, password });

      await SecureStore.setItemAsync(TOKEN_KEY, response.data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken);
      setUser(response.data.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Register the user
      await apiClient.post<{
        message: string;
        user: User;
      }>('/auth/register', { email, password, name });

      // Auto-login after successful registration
      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear tokens locally (no logout endpoint exists)
    await clearTokens();
    setUser(null);
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { TOKEN_KEY, REFRESH_TOKEN_KEY };
