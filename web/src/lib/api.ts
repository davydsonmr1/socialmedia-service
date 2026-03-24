// =====================================================
// LinkedBridge — API Client (Frontend)
// =====================================================
// Typed HTTP client for communicating with the backend.
//
// CRITICAL: All requests include `credentials: 'include'`
// so the browser sends the HttpOnly session cookie
// (`__Host-saas_session`) automatically with every request.
// =====================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

// ─── Types ───

export interface ApiKeySummary {
  id: string;
  keyHint: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateApiKeyResponse {
  data: {
    id: string;
    keyHint: string;
    plainKey: string;
  };
  meta: {
    warning: string;
  };
}

export interface ListApiKeysResponse {
  data: ApiKeySummary[];
  meta: {
    total: number;
  };
}

export interface RevokeApiKeyResponse {
  data: {
    id: string;
    keyHint: string;
    revokedAt: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ─── Client ───

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Only set Content-Type when there's a body to send.
    // Fastify rejects Content-Type: application/json with an empty body.
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers as Record<string, string>,
      },
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ApiError | null;
      const error = new Error(
        errorBody?.error?.message ?? `HTTP ${response.status}`,
      ) as Error & { status: number; code: string };
      error.status = response.status;
      error.code = errorBody?.error?.code ?? 'UNKNOWN';
      throw error;
    }

    return response.json() as Promise<T>;
  }

  // ─── API Key Management ───

  async getKeys(): Promise<ListApiKeysResponse> {
    return this.request<ListApiKeysResponse>('/api/saas/keys');
  }

  async createKey(): Promise<CreateApiKeyResponse> {
    return this.request<CreateApiKeyResponse>('/api/saas/keys', {
      method: 'POST',
    });
  }

  async revokeKey(id: string): Promise<RevokeApiKeyResponse> {
    return this.request<RevokeApiKeyResponse>(`/api/saas/keys/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(BASE_URL);

/**
 * URL to initiate the LinkedIn OAuth flow.
 * This is used with `window.location.href` — NOT fetch.
 */
export const OAUTH_LOGIN_URL = `${BASE_URL}/api/auth/linkedin`;
