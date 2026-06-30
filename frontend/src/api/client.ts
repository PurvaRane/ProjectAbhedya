import axios from "axios";

export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};
export const API_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});



apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("actor_type");
        localStorage.removeItem("role");
        window.location.href = '/customer/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  actor_type: "customer" | "employee";
}

export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  mobile_number?: string;
  role: string;
  is_active: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface MobileOTPResponse {
  message: string;
  mobile_number: string;
  expires_in_seconds: number;
}
