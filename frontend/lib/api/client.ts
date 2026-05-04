import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

function resolveApiBaseUrl(rawBaseUrl?: string) {
  if (!rawBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const url = new URL(rawBaseUrl);
    const normalizedPath = url.pathname.replace(/\/$/, '');

    if (!normalizedPath) {
      url.pathname = '/api/v1';
    } else if (!normalizedPath.endsWith('/api/v1')) {
      url.pathname = `${normalizedPath}/api/v1`;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
    return normalizedBaseUrl.endsWith('/api/v1')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api/v1`;
  }
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: agrega el token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: manejo de errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { TOKEN_KEY };
export default apiClient;
