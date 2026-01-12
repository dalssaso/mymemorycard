/**
 * Error thrown when AI configuration is missing or invalid.
 *
 * Use this error when required AI provider settings are absent or fail validation.
 *
 * @public
 * @extends Error
 * @param message - Human-readable configuration error message.
 *
 * @example
 * throw new ConfigurationError("AI provider not configured")
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";

    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConfigurationError.prototype);

    // Capture stack trace (V8 engines like Node/Bun)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}
