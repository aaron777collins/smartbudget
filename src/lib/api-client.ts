/**
 * Centralized API Client
 *
 * Type-safe API wrapper functions with automatic authentication,
 * error handling, and request/response interceptors.
 *
 * Usage:
 * ```typescript
 * import { apiClient } from '@/lib/api-client'
 *
 * // GET request
 * const transactions = await apiClient.get('/api/transactions')
 *
 * // POST request
 * const newTransaction = await apiClient.post('/api/transactions', { data })
 *
 * // With query parameters
 * const filtered = await apiClient.get('/api/transactions', {
 *   params: { timeframe: 'THIS_MONTH' }
 * })
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * API client request configuration
 */
export interface ApiRequestConfig {
  /** Query parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Skip automatic error handling (default: false) */
  skipErrorHandling?: boolean;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
  statusCode: number;
}

/**
 * API client error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Parse API error response
 */
async function parseError(response: Response): Promise<ApiClientError> {
  const statusCode = response.status;

  try {
    const errorData: ApiError = await response.json();
    return new ApiClientError(
      errorData.error || response.statusText || 'API request failed',
      statusCode,
      errorData.code,
      errorData.details
    );
  } catch {
    // Response is not JSON or is empty
    return new ApiClientError(
      response.statusText || `Request failed with status ${statusCode}`,
      statusCode
    );
  }
}

/**
 * Create timeout promise that rejects after specified duration
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new ApiClientError('Request timeout', 408));
    }, timeoutMs);
  });
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Make a GET request
 */
async function get<T = unknown>(
  endpoint: string,
  config?: ApiRequestConfig
): Promise<T> {
  const url = buildUrl(endpoint, config?.params);
  const timeout = config?.timeout ?? 30000;

  const fetchPromise = fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    credentials: 'include', // Include cookies for session auth
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeoutPromise(timeout),
  ]);

  if (!response.ok) {
    if (config?.skipErrorHandling) {
      throw response;
    }
    throw await parseError(response);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a POST request
 */
async function post<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<T> {
  const url = buildUrl(endpoint, config?.params);
  const timeout = config?.timeout ?? 30000;

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeoutPromise(timeout),
  ]);

  if (!response.ok) {
    if (config?.skipErrorHandling) {
      throw response;
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a PUT request
 */
async function put<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<T> {
  const url = buildUrl(endpoint, config?.params);
  const timeout = config?.timeout ?? 30000;

  const fetchPromise = fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeoutPromise(timeout),
  ]);

  if (!response.ok) {
    if (config?.skipErrorHandling) {
      throw response;
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a PATCH request
 */
async function patch<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<T> {
  const url = buildUrl(endpoint, config?.params);
  const timeout = config?.timeout ?? 30000;

  const fetchPromise = fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeoutPromise(timeout),
  ]);

  if (!response.ok) {
    if (config?.skipErrorHandling) {
      throw response;
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a DELETE request
 */
async function del<T = unknown>(
  endpoint: string,
  config?: ApiRequestConfig
): Promise<T> {
  const url = buildUrl(endpoint, config?.params);
  const timeout = config?.timeout ?? 30000;

  const fetchPromise = fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    credentials: 'include',
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeoutPromise(timeout),
  ]);

  if (!response.ok) {
    if (config?.skipErrorHandling) {
      throw response;
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// Exports
// ============================================================================

/**
 * API client with HTTP methods
 */
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del, // 'delete' is a reserved keyword
} as const;

/**
 * Default export for convenience
 */
export default apiClient;
