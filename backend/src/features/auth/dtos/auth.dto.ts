import { z } from "zod";

/**
 * Reusable password validation schema
 * Enforces UTF-8 byte length constraints (8-72 bytes) to ensure bcrypt compatibility
 */
const passwordSchema = z
  .string()
  .refine((value) => Buffer.byteLength(value, "utf8") >= 8, {
    message: "Password must be at least 8 bytes (accommodate multi-byte UTF-8 characters)",
  })
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must be at most 72 bytes to remain compatible with bcrypt",
  });

export const RegisterRequestSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username must be at most 50 characters" })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Username must contain only letters, numbers, underscores, and hyphens",
      }),
    email: z.email(),
    password: passwordSchema,
  })
  .openapi("RegisterRequest");

export const LoginRequestSchema = z
  .object({
    username: z.string().min(1, { message: "Username is required" }),
    password: passwordSchema,
  })
  .openapi("LoginRequest");

const AuthUserSchema = z
  .object({
    id: z.uuid(),
    username: z.string(),
    email: z.email(),
  })
  .openapi("User");

export const AuthResponseSchema = z
  .object({
    user: AuthUserSchema,
    token: z.string(),
  })
  .openapi("AuthResponse");

export const MeResponseSchema = z
  .object({
    user: AuthUserSchema,
  })
  .openapi("MeResponse");

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    request_id: z.string().optional(),
  })
  .openapi("ErrorResponse");

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
