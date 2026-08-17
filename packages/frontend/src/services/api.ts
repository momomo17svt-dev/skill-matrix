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

const TOKEN_STORAGE_KEY = 'skillmatrix_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
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

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Cookieセッション送信 (ハイブリッド対応)
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

export async function downloadFile(url: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('ファイルのダウンロードに失敗しました。');
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }, 100);
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
  },

  download: downloadFile
};
