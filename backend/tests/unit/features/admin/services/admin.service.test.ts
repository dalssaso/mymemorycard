import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import type { IAdminRepository } from "@/features/admin/repositories/admin.repository.interface";
import { AdminService } from "@/features/admin/services/admin.service";
import type { AdminSetting } from "@/features/admin/types";
import { createMockAdminRepository, createMockLogger } from "@/tests/helpers/repository.mocks";

describe("AdminService", () => {
  let service: AdminService;
  let mockRepository: IAdminRepository;

  beforeEach(() => {
    mockRepository = createMockAdminRepository();
    service = new AdminService(mockRepository, createMockLogger());
  });

  describe("getSettings", () => {
    it("should return defaults when no settings exist", async () => {
      const result = await service.getSettings();

      expect(result).toEqual({
        analytics: {
          enabled: false,
          provider: null,
          key: null,
          host: null,
        },
        search: {
          server_side: true,
          debounce_ms: 300,
        },
      });
    });

    it("should return stored settings when they exist", async () => {
      const storedSettings: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "umami",
        analyticsKey: "test-key",
        analyticsHost: "https://analytics.example.com",
        searchServerSide: false,
        searchDebounceMs: 500,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      };

      mockRepository.findSettings = async () => storedSettings;

      const result = await service.getSettings();

      expect(result).toEqual({
        analytics: {
          enabled: true,
          provider: "umami",
          key: "test-key",
          host: "https://analytics.example.com",
        },
        search: {
          server_side: false,
          debounce_ms: 500,
        },
      });
    });

    it("should convert camelCase to snake_case correctly", async () => {
      const storedSettings: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "plausible",
        analyticsKey: "key-123",
        analyticsHost: "https://plausible.io",
        searchServerSide: true,
        searchDebounceMs: 400,
        updatedAt: new Date("2026-01-15T12:30:00Z"),
      };

      mockRepository.findSettings = async () => storedSettings;

      const result = await service.getSettings();

      // Verify snake_case conversion in nested objects
      expect("server_side" in result.search).toBe(true);
      expect("debounce_ms" in result.search).toBe(true);
      // Verify camelCase is not present
      expect("serverSide" in result.search).toBe(false);
      expect("debounceMs" in result.search).toBe(false);
    });

    it("should propagate repository errors", async () => {
      mockRepository.findSettings = async () => {
        throw new Error("database connection failed");
      };

      await expect(service.getSettings()).rejects.toThrow("database connection failed");
    });
  });

  describe("updateSettings", () => {
    it("should update and return settings", async () => {
      const updatedSettings: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "posthog",
        analyticsKey: "new-key",
        analyticsHost: "https://posthog.example.com",
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T11:00:00Z"),
      };

      mockRepository.upsert = async () => updatedSettings;

      const result = await service.updateSettings({
        analyticsEnabled: true,
        analyticsProvider: "posthog",
        analyticsKey: "new-key",
        analyticsHost: "https://posthog.example.com",
      });

      expect(result.analytics.enabled).toBe(true);
      expect(result.analytics.provider).toBe("posthog");
      expect(result.analytics.key).toBe("new-key");
      expect(result.analytics.host).toBe("https://posthog.example.com");
    });

    it("should handle partial updates", async () => {
      let capturedData: unknown;

      mockRepository.upsert = async (data) => {
        capturedData = data;
        return {
          id: "550e8400-e29b-41d4-a716-446655440000",
          analyticsEnabled: false,
          analyticsProvider: null,
          analyticsKey: null,
          analyticsHost: null,
          searchServerSide: false,
          searchDebounceMs: 500,
          updatedAt: new Date("2026-01-15T11:00:00Z"),
        } as AdminSetting;
      };

      await service.updateSettings({ searchDebounceMs: 500 });

      expect(capturedData).toEqual({ searchDebounceMs: 500 });
    });

    it("should call repository.upsert with correct arguments", async () => {
      let capturedData: unknown;

      mockRepository.upsert = async (data) => {
        capturedData = data;
        return {
          id: "550e8400-e29b-41d4-a716-446655440000",
          analyticsEnabled: true,
          analyticsProvider: "umami",
          analyticsKey: null,
          analyticsHost: null,
          searchServerSide: true,
          searchDebounceMs: 300,
          updatedAt: new Date(),
        } as AdminSetting;
      };

      await service.updateSettings({
        analyticsEnabled: true,
        analyticsProvider: "umami",
      });

      expect(capturedData).toEqual({
        analyticsEnabled: true,
        analyticsProvider: "umami",
      });
    });

    it("should return mapped response with snake_case fields", async () => {
      mockRepository.upsert = async () =>
        ({
          id: "550e8400-e29b-41d4-a716-446655440000",
          analyticsEnabled: true,
          analyticsProvider: "google-analytics",
          analyticsKey: "GA-123",
          analyticsHost: null,
          searchServerSide: false,
          searchDebounceMs: 250,
          updatedAt: new Date("2026-01-15T10:00:00Z"),
        }) as AdminSetting;

      const result = await service.updateSettings({ analyticsEnabled: true });

      // Verify snake_case fields in nested response
      expect("server_side" in result.search).toBe(true);
      expect("debounce_ms" in result.search).toBe(true);
      expect(result.analytics.provider).toBe("google-analytics");
    });

    it("should propagate repository errors", async () => {
      mockRepository.upsert = async () => {
        throw new Error("constraint violation");
      };

      await expect(service.updateSettings({ analyticsEnabled: true })).rejects.toThrow(
        "constraint violation"
      );
    });
  });
});
