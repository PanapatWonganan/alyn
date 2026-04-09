/**
 * Alyn API Client SDK
 * Re-exports all client classes, types, and utilities
 *
 * @example Web usage (NextAuth session)
 * ```typescript
 * import { AlynApiClient } from '@/shared/api-client';
 *
 * const client = new AlynApiClient({
 *   baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
 * });
 *
 * // Use with NextAuth (session cookies handled automatically)
 * const novels = await client.novels.list({ page: 1, limit: 20 });
 * ```
 *
 * @example Mobile usage (JWT tokens)
 * ```typescript
 * import { AlynApiClient } from '@/shared/api-client';
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const client = new AlynApiClient({
 *   baseUrl: 'https://api.alyn.co',
 *   getAccessToken: async () => {
 *     return await AsyncStorage.getItem('accessToken');
 *   },
 *   onTokenExpired: async () => {
 *     const refreshToken = await AsyncStorage.getItem('refreshToken');
 *     if (!refreshToken) return null;
 *
 *     try {
 *       const response = await client.auth.refresh(refreshToken);
 *       await AsyncStorage.setItem('accessToken', response.accessToken);
 *       await AsyncStorage.setItem('refreshToken', response.refreshToken);
 *       return response.accessToken;
 *     } catch {
 *       // Refresh failed, clear tokens and redirect to login
 *       await AsyncStorage.removeItem('accessToken');
 *       await AsyncStorage.removeItem('refreshToken');
 *       return null;
 *     }
 *   },
 * });
 *
 * // Login
 * const authResponse = await client.auth.login('user@example.com', 'password');
 * await AsyncStorage.setItem('accessToken', authResponse.accessToken);
 * await AsyncStorage.setItem('refreshToken', authResponse.refreshToken);
 *
 * // Use authenticated endpoints
 * const profile = await client.users.me();
 * ```
 */

// ==================== Exports ====================

// Core client
export { ApiClient, ApiError } from './client';
export type { ApiClientConfig, RequestOptions } from './client';

// Endpoint client
export { AlynApiClient } from './endpoints';
export type { AuthTokenResponse, SearchResponse } from './endpoints';

// ==================== Factory Functions ====================

import { AlynApiClient } from './endpoints';
import type { ApiClientConfig } from './client';

/**
 * Create a new Alyn API client instance
 * @param config Client configuration
 * @returns Configured API client
 */
export function createApiClient(config: ApiClientConfig): AlynApiClient {
  return new AlynApiClient(config);
}

/**
 * Create a web client (for Next.js with NextAuth)
 * Session cookies are automatically handled by the browser
 */
export function createWebClient(baseUrl?: string): AlynApiClient {
  return new AlynApiClient({
    baseUrl: baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  });
}

/**
 * Create a mobile client (for React Native with JWT tokens)
 * Requires token management functions
 */
export function createMobileClient(
  config: Pick<ApiClientConfig, 'baseUrl' | 'getAccessToken' | 'onTokenExpired'>
): AlynApiClient {
  return new AlynApiClient(config);
}

// ==================== Default Export ====================

/**
 * Default export: AlynApiClient class
 */
export default AlynApiClient;
