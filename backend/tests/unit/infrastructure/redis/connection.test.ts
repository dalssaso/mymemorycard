import { beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { createMockConfig, createMockLogger } from "@/tests/helpers/repository.mocks";

// Mock redis module before importing RedisConnection
const mockConnect = mock().mockResolvedValue(undefined);
const mockQuit = mock().mockResolvedValue(undefined);
const mockPing = mock().mockResolvedValue("PONG");
const mockOn = mock();

const mockCreateClient = mock().mockReturnValue({
  connect: mockConnect,
  quit: mockQuit,
  ping: mockPing,
  on: mockOn,
});

mock.module("redis", () => ({
  createClient: mockCreateClient,
}));

// Now import after mocking
import { RedisConnection } from "@/infrastructure/redis/connection";

describe("RedisConnection", () => {
  beforeEach(() => {
    mockCreateClient.mockClear();
    mockConnect.mockClear();
    mockQuit.mockClear();
    mockPing.mockClear();
    mockOn.mockClear();

    // Reset to default implementations
    mockCreateClient.mockReturnValue({
      connect: mockConnect,
      quit: mockQuit,
      ping: mockPing,
      on: mockOn,
    });
    mockConnect.mockResolvedValue(undefined);
    mockQuit.mockResolvedValue(undefined);
    mockPing.mockResolvedValue("PONG");
  });

  describe("getClient()", () => {
    it("should create and connect client on first call", async () => {
      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      await connection.getClient();

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it("should return same client on subsequent calls", async () => {
      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      const client1 = await connection.getClient();
      const client2 = await connection.getClient();

      expect(client1).toBe(client2);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it("should skip connect when shouldSkipConnect is true", async () => {
      const config = createMockConfig({ skipRedisConnect: true });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      await connection.getClient();

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe("healthCheck()", () => {
    it("should return true when ping succeeds", async () => {
      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      const result = await connection.healthCheck();

      expect(result).toBe(true);
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    it("should return false when ping fails", async () => {
      mockPing.mockRejectedValue(new Error("Connection refused"));

      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      const result = await connection.healthCheck();

      expect(result).toBe(false);
    });

    it("should return true when shouldSkipConnect is true without pinging", async () => {
      const config = createMockConfig({ skipRedisConnect: true });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      const result = await connection.healthCheck();

      expect(result).toBe(true);
      expect(mockPing).not.toHaveBeenCalled();
    });
  });

  describe("close()", () => {
    it("should quit client when connected", async () => {
      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      // First connect
      await connection.getClient();

      // Then close
      await connection.close();

      expect(mockQuit).toHaveBeenCalledTimes(1);
    });

    it("should not throw when not connected", async () => {
      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      // Close without ever connecting
      await expect(connection.close()).resolves.toBeUndefined();
      expect(mockQuit).not.toHaveBeenCalled();
    });

    it("should throw when quit fails", async () => {
      const quitError = new Error("Quit failed");
      mockQuit.mockRejectedValue(quitError);

      const config = createMockConfig({ skipRedisConnect: false });
      const logger = createMockLogger();
      const connection = new RedisConnection(config, logger);

      // First connect
      await connection.getClient();

      // Then close should throw
      await expect(connection.close()).rejects.toThrow("Quit failed");
    });
  });
});
