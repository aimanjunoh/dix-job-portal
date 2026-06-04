const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    if (!path.includes('/auth/')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },
  users: {
    list: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/users?${qs}`);
    },
    all: () => request('/users/all'),
    get: (id: number) => request(`/users/${id}`),
    create: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),
  },
  requests: {
    list: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/requests?${qs}`);
    },
    dashboard: () => request('/requests/dashboard'),
    get: (id: number) => request(`/requests/${id}`),
    create: (data: any) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/requests/${id}`, { method: 'DELETE' }),
  },
  activities: {
    list: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/activities?${qs}`);
    },
  },
};
