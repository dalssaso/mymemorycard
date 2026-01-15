import "reflect-metadata";
import { beforeEach, describe, expect, it } from "bun:test";
import { UserPlatformsService } from "@/features/user-platforms/services/user-platforms.service";
import type { IUserPlatformsService } from "@/features/user-platforms/services/user-platforms.service.interface";
import type { IUserPlatformsRepository } from "@/features/user-platforms/repositories/user-platforms.repository.interface";
import type { UserPlatform, CreateUserPlatformInput } from "@/features/user-platforms/types";
import { NotFoundError, ForbiddenError } from "@/shared/errors/base";
import { createMockLogger } from "@/tests/helpers/repository.mocks";

const createMockRepository = (): IUserPlatformsRepository => ({
  findById: async () => null,
  findByUserId: async () => [],
  findByUserAndPlatform: async () => null,
  create: async () =>
    ({
      id: "test-id",
      userId: "test-user-id",
      platformId: "test-platform-id",
      username: null,
      iconUrl: null,
      profileUrl: null,
      notes: null,
      createdAt: new Date(),
    }) as UserPlatform,
  update: async () => ({} as UserPlatform),
  delete: async () => {},
  deleteByUserId: async () => {},
});

describe("UserPlatformsService", () => {
  let service: IUserPlatformsService;
  let mockRepository: IUserPlatformsRepository;
  const testUserId = "user-uuid-001";
  const testPlatformId = "platform-uuid-001";

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new UserPlatformsService(mockRepository, createMockLogger());
  });

  describe("getUserPlatforms", () => {
    it("should return user platforms with snake_case fields", async () => {
      const mockPlatforms: UserPlatform[] = [
        {
          id: "up-1",
          userId: testUserId,
          platformId: testPlatformId,
          username: "user1",
          iconUrl: "https://example.com/icon.png",
          profileUrl: "https://example.com/profile",
          notes: "Test notes",
          createdAt: new Date("2026-01-14T10:00:00Z"),
        },
      ];

      mockRepository.findByUserId = async () => mockPlatforms;

      const result = await service.getUserPlatforms(testUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        id: "up-1",
        user_id: testUserId,
        platform_id: testPlatformId,
        username: "user1",
        icon_url: "https://example.com/icon.png",
        profile_url: "https://example.com/profile",
        notes: "Test notes",
      });
      expect(result[0].created_at).toBeDefined();
      // Verify snake_case conversion
      expect("user_id" in result[0]).toBe(true);
      expect("userId" in result[0]).toBe(false);
    });

    it("should return empty array if no platforms", async () => {
      mockRepository.findByUserId = async () => [];

      const result = await service.getUserPlatforms(testUserId);

      expect(result).toEqual([]);
    });

    it("should handle optional fields as null", async () => {
      const mockPlatforms: UserPlatform[] = [
        {
          id: "up-1",
          userId: testUserId,
          platformId: testPlatformId,
          username: null,
          iconUrl: null,
          profileUrl: null,
          notes: null,
          createdAt: new Date(),
        },
      ];

      mockRepository.findByUserId = async () => mockPlatforms;

      const result = await service.getUserPlatforms(testUserId);

      expect(result[0].username).toBeNull();
      expect(result[0].icon_url).toBeNull();
    });
  });

  describe("addPlatform", () => {
    it("should add platform for user and return snake_case response", async () => {
      const input: CreateUserPlatformInput = {
        platformId: testPlatformId,
        username: "newuser",
        iconUrl: "https://example.com/icon.png",
      };

      const mockPlatform: UserPlatform = {
        id: "new-id",
        userId: testUserId,
        platformId: testPlatformId,
        username: "newuser",
        iconUrl: "https://example.com/icon.png",
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockRepository.create = async () => mockPlatform;

      const result = await service.addPlatform(testUserId, input);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(testUserId);
      expect(result.platform_id).toBe(testPlatformId);
      expect(result.username).toBe("newuser");
      expect(result.icon_url).toBe("https://example.com/icon.png");
    });

    it("should handle platforms without optional fields", async () => {
      const input: CreateUserPlatformInput = {
        platformId: testPlatformId,
      };

      const mockPlatform: UserPlatform = {
        id: "new-id",
        userId: testUserId,
        platformId: testPlatformId,
        username: null,
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockRepository.create = async () => mockPlatform;

      const result = await service.addPlatform(testUserId, input);

      expect(result.username).toBeNull();
      expect(result.icon_url).toBeNull();
    });
  });

  describe("updatePlatform", () => {
    it("should update platform and return snake_case response", async () => {
      const existingPlatform: UserPlatform = {
        id: "up-1",
        userId: testUserId,
        platformId: testPlatformId,
        username: "oldname",
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      const updatedPlatform: UserPlatform = {
        ...existingPlatform,
        username: "newname",
        notes: "Updated notes",
      };

      mockRepository.findById = async () => existingPlatform;
      mockRepository.update = async () => updatedPlatform;

      const result = await service.updatePlatform(testUserId, "up-1", {
        username: "newname",
        notes: "Updated notes",
      });

      expect(result.username).toBe("newname");
      expect(result.notes).toBe("Updated notes");
      expect(result.user_id).toBe(testUserId);
    });

    it("should throw NotFoundError if platform does not exist", async () => {
      mockRepository.findById = async () => null;

      try {
        await service.updatePlatform(testUserId, "nonexistent", {
          username: "newname",
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof NotFoundError).toBe(true);
      }
    });

    it("should throw ForbiddenError if platform belongs to different user", async () => {
      const userPlatform: UserPlatform = {
        id: "up-1",
        userId: "different-user",
        platformId: testPlatformId,
        username: "user1",
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockRepository.findById = async () => userPlatform;

      try {
        await service.updatePlatform(testUserId, "up-1", {
          username: "newname",
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof ForbiddenError).toBe(true);
      }
    });
  });

  describe("removePlatform", () => {
    it("should remove platform for user", async () => {
      const userPlatform: UserPlatform = {
        id: "up-1",
        userId: testUserId,
        platformId: testPlatformId,
        username: "user1",
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockRepository.findById = async () => userPlatform;
      mockRepository.delete = async () => {};

      await expect(service.removePlatform(testUserId, "up-1")).resolves.not.toThrow();
    });

    it("should throw ForbiddenError if platform belongs to different user", async () => {
      const userPlatform: UserPlatform = {
        id: "up-1",
        userId: "different-user",
        platformId: testPlatformId,
        username: "user1",
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockRepository.findById = async () => userPlatform;

      try {
        await service.removePlatform(testUserId, "up-1");
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof ForbiddenError).toBe(true);
      }
    });

    it("should throw NotFoundError if platform does not exist", async () => {
      mockRepository.findById = async () => null;

      try {
        await service.removePlatform(testUserId, "nonexistent");
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof NotFoundError).toBe(true);
      }
    });
  });
});
