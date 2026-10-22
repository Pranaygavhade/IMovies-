import axios from 'axios';

// Strict relative base URL per architecture specification
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('imovies_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiry (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('imovies_token')) {
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
        window.dispatchEvent(new Event('imovies_auth_change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
