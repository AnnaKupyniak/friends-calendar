import axios from 'axios';

// Use empty string so requests go through Vite proxy (same origin = cookies work)
const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let authContextRef = null;

// Set reference to auth context after it's initialized
export function setAuthContextRef(authContext) {
  authContextRef = authContext;
}

// Response interceptor for 401/403 errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;

    if (status === 401) {
      // Unauthorized - clear user state, ProtectedRoute handles redirect
      if (authContextRef) {
        authContextRef.setUser(null);
      }
    } else if (status === 403) {
      // Forbidden - user doesn't have permission
      if (authContextRef) {
        authContextRef.setError('Доступ заборонено. У вас немає дозволу на цю дію.');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
