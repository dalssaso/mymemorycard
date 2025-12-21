import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Games API
export const gamesAPI = {
  getAll: () => api.get('/games'),
  getOne: (id: string) => api.get(`/games/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/games/${id}/status`, { status }),
  updateRating: (id: string, rating: number) =>
    api.put(`/games/${id}/rating`, { rating }),
};

// Import API
export const importAPI = {
  bulk: (gameNames: string[], platformId?: string) =>
    api.post('/import/bulk', { gameNames, platformId }),
}

// Platforms API
export const platformsAPI = {
  getAll: () => api.get('/platforms'),
};
