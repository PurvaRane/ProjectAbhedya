import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character");

/* =====================================================
   EMAIL REGISTRATION
===================================================== */

export const emailRegisterSchema = z
  .object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const emailOtpSchema = z.object({
  email: z.string().email(),
  otp_code: z.string().min(4, "OTP is required"),
});

/* =====================================================
   MOBILE REGISTRATION
===================================================== */

export const mobileNumberSchema = z.object({
  mobile_number: z
    .string()
    .min(10, "Enter a valid 10-digit mobile number")
    .regex(/^(\+91)?[6-9]\d{9}$|^\d{10}$/, "Invalid mobile number"),
});

export const mobileOtpSchema = z.object({
  mobile_number: z.string(),
  otp_code: z.string().min(4, "OTP is required"),
});

export const mobileCompleteSchema = z
  .object({
    mobile_number: z.string(),
    full_name: z.string().min(2, "Full name is required"),

    pan_number: z
      .string()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Invalid PAN format (e.g. ABCDE1234F)"
      ),

    email: z.string().email("Invalid email address"),

    password: passwordSchema,

    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

/* =====================================================
   AADHAAR REGISTRATION
===================================================== */

export const aadhaarSendOtpSchema = z.object({
  aadhaar_number: z
    .string()
    .regex(
      /^\d{12}$/,
      "Aadhaar must be exactly 12 digits"
    ),

  mobile_number: z
    .string()
    .regex(
      /^(\+91)?[6-9]\d{9}$|^\d{10}$/,
      "Invalid mobile number"
    ),
});

export const aadhaarOtpSchema = z.object({
  aadhaar_number: z
    .string()
    .regex(
      /^\d{12}$/,
      "Aadhaar must be exactly 12 digits"
    ),

  mobile_number: z.string(),

  otp_code: z
    .string()
    .length(
      6,
      "OTP must be 6 digits"
    ),
});

export const aadhaarCompleteSchema = z
  .object({
    aadhaar_number: z
      .string()
      .regex(
        /^\d{12}$/,
        "Aadhaar must be exactly 12 digits"
      ),

    mobile_number: z.string(),

    full_name: z
      .string()
      .min(2, "Full name is required"),

    email: z
      .string()
      .email("Invalid email address"),

    pan_number: z
      .string()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Invalid PAN format"
      ),

    password: passwordSchema,

    confirm_password: z.string(),
  })
  .refine(
    (data) =>
      data.password === data.confirm_password,
    {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }
  );

/* =====================================================
   LOGIN
===================================================== */

export const customerLoginSchema = z.object({
  identifier: z
    .string()
    .min(
      1,
      "Email or mobile number is required"
    ),

  password: z
    .string()
    .min(
      1,
      "Password is required"
    ),
});

export const employeeLoginSchema = z.object({
  email: z.string().email("Invalid employee email"),
  password: z.string().min(1, "Password is required"),
});

/* =====================================================
   TYPES
===================================================== */

export type EmailRegisterForm =
  z.infer<typeof emailRegisterSchema>;

export type EmailOtpForm =
  z.infer<typeof emailOtpSchema>;

export type MobileNumberForm =
  z.infer<typeof mobileNumberSchema>;

export type MobileOtpForm =
  z.infer<typeof mobileOtpSchema>;

export type MobileCompleteForm =
  z.infer<typeof mobileCompleteSchema>;

export type AadhaarSendOtpForm =
  z.infer<typeof aadhaarSendOtpSchema>;

export type AadhaarOtpForm =
  z.infer<typeof aadhaarOtpSchema>;

export type AadhaarCompleteForm =
  z.infer<typeof aadhaarCompleteSchema>;

export type CustomerLoginForm =
  z.infer<typeof customerLoginSchema>;

export type EmployeeLoginForm =
  z.infer<typeof employeeLoginSchema>;