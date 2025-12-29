const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get auth headers
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  async register(username: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  // Get all links with filters
  async getLinks(params?: {
    skip?: number;
    limit?: number;
    is_read?: boolean;
    is_favorite?: boolean;
    tag?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${API_URL}/api/links?${queryParams.toString()}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (!response.ok) throw new Error('Failed to fetch links');
    return response.json();
  },

  // Get single link
  async getLink(id: string) {
    const response = await fetch(`${API_URL}/api/links/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch link');
    return response.json();
  },

  // Update link
  async updateLink(id: string, data: {
    is_read?: boolean;
    is_favorite?: boolean;
    tags?: string[];
    scheduled_at?: string | null;
  }) {
    const response = await fetch(`${API_URL}/api/links/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update link');
    return response.json();
  },

  // Delete link
  async deleteLink(id: string) {
    const response = await fetch(`${API_URL}/api/links/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete link');
    return response.json();
  },

  // Get all tags
  async getTags() {
    const response = await fetch(`${API_URL}/api/tags`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  },

  // Get statistics
  async getStats() {
    const response = await fetch(`${API_URL}/api/stats`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
