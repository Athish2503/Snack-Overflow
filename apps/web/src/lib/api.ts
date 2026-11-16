const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

const TOKEN_KEY = 'snackoverflow_auth_token';
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return memoryToken || localStorage.getItem(TOKEN_KEY);
  }
  return memoryToken;
}

export function setAuthToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${BASE}${normalizedPath}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Request failed',
    );
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
