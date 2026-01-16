import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";
import { EncryptionService } from "@/features/credentials/services/encryption.service";
import type { IConfig } from "@/infrastructure/config/config.interface";
import { makeTestConfig } from "../../../helpers/make-test-config";

describe("EncryptionService", () => {
  let service: EncryptionService;
  let config: IConfig;

  beforeEach(() => {
    config = makeTestConfig();
    service = new EncryptionService(config);
  });

  describe("encrypt", () => {
    it("should encrypt a string value", () => {
      const data = "test-secret";
      const encrypted = service.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(data);
    });

    it("should encrypt an object", () => {
      const data = { clientId: "test-id", clientSecret: "test-secret" };
      const encrypted = service.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });

    it("should produce different ciphertext for same input (random IV)", () => {
      const data = "test-secret";
      const encrypted1 = service.encrypt(data);
      const encrypted2 = service.encrypt(data);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should encrypt empty string", () => {
      const encrypted = service.encrypt("");
      const decrypted = service.decrypt<string>(encrypted);

      expect(decrypted).toBe("");
    });

    it("should encrypt null value", () => {
      const encrypted = service.encrypt(null);
      const decrypted = service.decrypt<null>(encrypted);

      expect(decrypted).toBe(null);
    });

    it("should throw on undefined input (JSON.stringify returns undefined)", () => {
      // JSON.stringify(undefined) returns undefined (not a string),
      // which causes cipher.update to fail
      expect(() => service.encrypt(undefined)).toThrow();
    });

    it("should encrypt very large payloads", () => {
      const largeData = { content: "x".repeat(100000) };
      const encrypted = service.encrypt(largeData);
      const decrypted = service.decrypt<typeof largeData>(encrypted);

      expect(decrypted.content.length).toBe(100000);
    });
  });

  describe("decrypt", () => {
    it("should decrypt to original string value", () => {
      const data = "test-secret";
      const encrypted = service.encrypt(data);
      const decrypted = service.decrypt<string>(encrypted);

      expect(decrypted).toBe(data);
    });

    it("should decrypt to original object", () => {
      const data = { clientId: "test-id", clientSecret: "test-secret" };
      const encrypted = service.encrypt(data);
      const decrypted = service.decrypt<typeof data>(encrypted);

      expect(decrypted).toEqual(data);
    });

    it("should throw on tampered ciphertext", () => {
      const data = "test-secret";
      const encrypted = service.encrypt(data);
      const tampered = encrypted.slice(0, -5) + "XXXXX";

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it("should throw on empty ciphertext", () => {
      expect(() => service.decrypt("")).toThrow();
    });

    it("should throw on invalid base64 ciphertext", () => {
      expect(() => service.decrypt("not-valid-base64!!!")).toThrow();
    });

    it("should throw on truncated ciphertext (too short for IV + auth tag)", () => {
      // IV is 12 bytes, auth tag is 16 bytes = minimum 28 bytes
      const tooShort = Buffer.alloc(20).toString("base64");
      expect(() => service.decrypt(tooShort)).toThrow();
    });

    it("should throw when decrypting with wrong key", () => {
      const data = "test-secret";
      const encrypted = service.encrypt(data);

      // Create service with different encryption secret
      const differentConfig = makeTestConfig();
      differentConfig.encryption.secret = "different-secret-key-for-testing-32ch";
      const differentService = new EncryptionService(differentConfig);

      expect(() => differentService.decrypt(encrypted)).toThrow();
    });
  });
});
