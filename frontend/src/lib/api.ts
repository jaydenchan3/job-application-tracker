import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api'; // Your correct port

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // Your correct token key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ADD THIS FUNCTION:
export const getFileUrl = (relativePath: string) => {
  return `http://localhost:3002${relativePath}`; // Your correct port
};