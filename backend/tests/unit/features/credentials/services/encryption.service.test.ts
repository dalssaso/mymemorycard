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
  });
});
