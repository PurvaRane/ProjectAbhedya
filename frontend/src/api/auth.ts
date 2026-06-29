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

    sendAadhaarOTP: (data: {
    aadhaar_number: string;
    mobile_number: string;
  }) =>
    apiClient.post("/auth/customer/aadhaar/send-otp", data),

  verifyAadhaarOTP: (data: {
    aadhaar_number: string;
    mobile_number: string;
    otp_code: string;
  }) =>
    apiClient.post("/auth/customer/aadhaar/verify-otp", data),

  completeAadhaarRegistration: (data: {
    aadhaar_number: string;
    mobile_number: string;
    full_name: string;
    email: string;
    pan_number: string;
    password: string;
    confirm_password: string;
  }) =>
    apiClient.post<UserResponse>(
      "/auth/customer/aadhaar/complete-registration",
      data
    ),

  enrollFace: (
    aadhaar_number: string,
    file: File
  ) => {
    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    return apiClient.post(
      `/auth/customer/aadhaar/enroll-face?aadhaar_number=${aadhaar_number}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  verifyFace: (
    aadhaar_number: string,
    file: File
  ) => {
    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    return apiClient.post(
      `/auth/customer/aadhaar/verify-face?aadhaar_number=${aadhaar_number}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  customerLogin: (data: { identifier: string; password: string }) =>
    apiClient.post<TokenResponse>("/auth/customer/login", data),

  getEmployeeCaptcha: () => 
    apiClient.get<{question: string; token: string}>("/auth/employee/captcha"),
    
  employeeLoginStep1: (data: {
    email: string;
    password: string;
    device_id: string;
    captcha_token: string;
    captcha_answer: string;
    typing_speed_ms: number;
    mouse_clicks: number;
  }) =>
    apiClient.post<{ message: string; next_step: "REQUIRE_OTP" | "REQUIRE_FACE" | "SUCCESS" }>("/auth/employee/login", data),

  employeeVerifyOTP: (data: { email: string; otp_code: string; device_id: string }) =>
    apiClient.post<{ message: string; next_step: "REQUIRE_FACE" | "SUCCESS" }>("/auth/employee/verify-otp", data),

  employeeVerifyFace: (data: { email: string; image_base64: string; device_id: string }) =>
    apiClient.post<TokenResponse>("/auth/employee/verify-face", data),
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
