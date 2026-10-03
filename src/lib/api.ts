import { AuthStatus, NoteDetail, NoteMeta, SearchResult, SharedNoteContent, SharedNoteMeta } from './types';

const TOKEN_KEY = 'cosmo_token';
const LAST_ACTIVE_KEY = 'cosmo_last_active';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  },
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  },
  touch: () => {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  },
  getLastActive: () => {
    const val = localStorage.getItem(LAST_ACTIVE_KEY);
    return val ? parseInt(val, 10) : 0;
  },
};

let onUnauthorizedCallback: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    tokenStorage.touch();
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (res.status === 401 && !endpoint.startsWith('/api/auth/') && !endpoint.startsWith('/api/share/')) {
    tokenStorage.remove();
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    throw new Error('UNAUTHORIZED');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data as T;
}

export const api = {
  auth: {
    getStatus: () => request<AuthStatus>('/api/auth/status'),
    setup: (password: string, appTitle?: string) =>
      request<{ ok: boolean; token: string; message: string }>('/api/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ password, appTitle }),
      }),
    unlock: (password: string) =>
      request<{ ok: boolean; token: string }>('/api/auth/unlock', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  notes: {
    list: () => request<NoteMeta[]>('/api/notes'),
    get: (id: string) => request<NoteDetail>(`/api/notes/${id}`),
    create: (data: Partial<NoteDetail>) =>
      request<NoteDetail>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<NoteDetail>) =>
      request<NoteDetail>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean; deleted: number }>(`/api/notes/${id}`, {
        method: 'DELETE',
      }),
    search: (query: string) => request<SearchResult[]>(`/api/notes/search?q=${encodeURIComponent(query)}`),
  },

  share: {
    // Owner
    updateShare: (noteId: string, data: { is_shared: boolean; password?: string; remove_password?: boolean }) =>
      request<{ ok: boolean; is_shared: boolean; share_slug: string; has_share_password: boolean }>(
        `/api/notes/${noteId}/share`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    // Public Visitor
    getMeta: (slug: string) => request<SharedNoteMeta>(`/api/share/${slug}/meta`),
    view: (slug: string, password?: string) =>
      request<SharedNoteContent>(`/api/share/${slug}/view`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
  },

  settings: {
    get: () => request<Record<string, string>>('/api/settings'),
    update: (data: Record<string, string>) =>
      request<{ ok: boolean }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
