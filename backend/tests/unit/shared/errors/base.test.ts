import { describe, it, expect } from "bun:test";
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "@/shared/errors/base";

describe("DomainError", () => {
  it("should create error with message, code, and status", () => {
    const error = new ValidationError("Invalid input", { field: "username" });

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: "username" });
  });

  it("should create NotFoundError with resource", () => {
    const error = new NotFoundError("User", "123");

    expect(error.message).toBe("User with id 123 not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });

  it("should create UnauthorizedError", () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe("Unauthorized");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.statusCode).toBe(401);
  });

  it("should create ForbiddenError", () => {
    const error = new ForbiddenError();

    expect(error.message).toBe("Forbidden");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.statusCode).toBe(403);
  });

  it("should create ConflictError", () => {
    const error = new ConflictError("User already exists");

    expect(error.message).toBe("User already exists");
    expect(error.code).toBe("CONFLICT");
    expect(error.statusCode).toBe(409);
  });
});
