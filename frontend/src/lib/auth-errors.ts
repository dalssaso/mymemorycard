/**
 * Normalize auth error responses into user-friendly messages
 * Handles multiple error formats from the API
 */
export function normalizeAuthError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const responseError = (error as { response?: { data?: { error?: unknown } } }).response?.data
      ?.error;

    // Handle string errors from backend
    if (typeof responseError === "string") {
      return responseError;
    }

    // Handle Zod validation error objects { name: "ZodError", message: "..." }
    if (responseError && typeof responseError === "object" && "message" in responseError) {
      return String((responseError as { message: unknown }).message);
    }
  }

  // Fallback for unknown error formats
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
