import { z } from "zod";

export const RegisterRequestSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(50, { message: "Username must be at most 50 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username must contain only letters, numbers, underscores, and hyphens",
    }),
  email: z.email(),
  password: z
    .string()
    .refine(
      (value) => Buffer.byteLength(value, "utf8") >= 8,
      {
        message:
          "Password must be at least 8 bytes (accommodate multi-byte UTF-8 characters)",
      }
    )
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      {
        message:
          "Password must be at most 72 bytes to remain compatible with bcrypt",
      }
    ),
});

export const LoginRequestSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .refine(
      (value) => Buffer.byteLength(value, "utf8") >= 8,
      {
        message:
          "Password must be at least 8 bytes (accommodate multi-byte UTF-8 characters)",
      }
    )
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      {
        message:
          "Password must be at most 72 bytes to remain compatible with bcrypt",
      }
    ),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.uuid(),
    username: z.string(),
    email: z.email(),
  }),
  token: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
