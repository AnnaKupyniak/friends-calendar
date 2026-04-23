import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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
      // Unauthorized - token expired or invalid
      if (authContextRef) {
        authContextRef.setUser(null);
        authContextRef.setError('Your session has expired. Please log in again.');
      }
      // Redirect to login will happen via ProtectedRoute
      window.location.href = '/login';
    } else if (status === 403) {
      // Forbidden - user doesn't have permission
      if (authContextRef) {
        authContextRef.setError('Access denied. You do not have permission to perform this action.');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
