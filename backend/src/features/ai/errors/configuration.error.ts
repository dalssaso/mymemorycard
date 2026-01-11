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
