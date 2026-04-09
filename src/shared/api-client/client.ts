/**
 * Core HTTP client for Alyn API
 * Handles authentication, request/response transformation, and error handling
 */

// ==================== Configuration Types ====================

export interface ApiClientConfig {
  baseUrl: string;
  /** For mobile: Bearer token auth - function to get current access token */
  getAccessToken?: () => Promise<string | null>;
  /** For mobile: called when token expires (401), should refresh and return new token */
  onTokenExpired?: () => Promise<string | null>;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// ==================== Error Types ====================

/**
 * Custom API error class
 * Thrown when the API returns an error response
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if this is an authentication error (401)
   */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if this is a forbidden error (403)
   */
  get isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if this is a not found error (404)
   */
  get isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if this is a validation error (400)
   */
  get isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if this is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// ==================== Core Client ====================

/**
 * Core HTTP client class
 * Handles all HTTP communication with the Alyn API
 */
export class ApiClient {
  protected config: ApiClientConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private async buildHeaders(customHeaders?: Record<string, string>): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...customHeaders,
    };

    // Add authorization header if getAccessToken is provided
    if (this.config.getAccessToken) {
      const token = await this.config.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        if (this.config.onTokenExpired) {
          const newToken = await this.config.onTokenExpired();
          return newToken;
        }
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Core request method with automatic retry on 401 (token refresh)
   */
  protected async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const headers = await this.buildHeaders(options.headers);

    const requestInit: RequestInit = {
      method,
      headers,
      signal: options.signal,
    };

    // Add body for POST/PUT/PATCH
    if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestInit.body = JSON.stringify(options.body);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - try to refresh token and retry once
      if (response.status === 401 && this.config.onTokenExpired) {
        const newToken = await this.handleTokenRefresh();

        if (newToken) {
          // Retry request with new token
          const retryHeaders = await this.buildHeaders(options.headers);
          const retryResponse = await fetch(url, {
            ...requestInit,
            headers: retryHeaders,
            signal: options.signal,
          });

          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      throw error;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // Try to parse response body
    let data: any;
    if (isJson) {
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, use text
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
      const errorCode = data?.code;
      const errorDetails = data?.details;

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    // If response has 'data' field, unwrap it
    if (data && typeof data === 'object' && 'data' in data) {
      return data as T;
    }

    // Otherwise return the whole response
    return data as T;
  }

  // ==================== Convenience Methods ====================

  /**
   * GET request
   */
  public get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  /**
   * POST request
   */
  public post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  /**
   * PUT request
   */
  public put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  /**
   * PATCH request
   */
  public patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  /**
   * DELETE request
   */
  public delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Upload file (multipart/form-data)
   */
  public async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = this.buildUrl(path);

    // Build headers WITHOUT Content-Type (let browser set it with boundary)
    const headers: Record<string, string> = {
      ...this.config.headers,
    };

    // Add authorization if needed
    if (this.config.getAccessToken) {
      const token = await this.config.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Update client configuration
   */
  public updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ApiClientConfig> {
    return { ...this.config };
  }
}
