import { ApiResponse } from '@skillmatrix/shared';

export class ApiError extends Error {
  public code: string;
  public details?: unknown;
  public status: number;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Cookieセッション送信
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: ApiResponse<T> = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = data?.error || {
      code: 'HTTP_ERROR',
      message: response.statusText || 'リクエストに失敗しました。'
    };
    throw new ApiError(response.status, error.code, error.message, error.details);
  }

  return data.data as T;
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => {
    let finalUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) finalUrl += `?${queryString}`;
    }
    return request<T>(finalUrl, { method: 'GET' });
  },

  post: <T>(url: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return request<T>(url, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  put: <T>(url: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return request<T>(url, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  delete: <T>(url: string) => {
    return request<T>(url, { method: 'DELETE' });
  }
};
