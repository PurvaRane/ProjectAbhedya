import axios from "axios";

export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};
export const API_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
