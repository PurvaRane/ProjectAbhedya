import { apiClient, MessageResponse, MobileOTPResponse, TokenResponse, UserResponse } from "./client";

export const authApi = {
  registerEmail: (data: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => apiClient.post<{ message: string; email: string }>("/auth/customer/register/email", data),

  verifyEmailOTP: (data: { email: string; otp_code: string }) =>
    apiClient.post<MessageResponse>("/auth/customer/register/email/verify-otp", data),

  sendMobileOTP: (data: { mobile_number: string }) =>
    apiClient.post<MobileOTPResponse>("/auth/customer/register/mobile/send-otp", data),

  verifyMobileOTP: (data: { mobile_number: string; otp_code: string }) =>
    apiClient.post<{ message: string; mobile_number: string; verified: boolean }>(
      "/auth/customer/register/mobile/verify-otp",
      data
    ),

  completeMobileRegistration: (data: {
    mobile_number: string;
    full_name: string;
    pan_number: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => apiClient.post<UserResponse>("/auth/customer/register/mobile/complete", data),

  customerLogin: (data: { identifier: string; password: string }) =>
    apiClient.post<TokenResponse>("/auth/customer/login", data),

  employeeLogin: (data: { email: string; password: string }) =>
    apiClient.post<TokenResponse>("/auth/employee/login", data),
};

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as { response?: { data?: { detail?: string | { msg: string }[] } } };
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return "An unexpected error occurred. Please try again.";
}
