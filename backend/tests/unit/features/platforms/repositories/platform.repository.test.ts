import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";
import { PostgresPlatformRepository } from "@/features/platforms/repositories/platform.repository";
import {
  createMockDrizzleDB,
  mockSelectAllError,
  mockSelectAllResult,
  mockSelectError,
  mockSelectResult,
} from "@/tests/helpers/drizzle.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";

describe("PostgresPlatformRepository", () => {
  let repository: PostgresPlatformRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresPlatformRepository(mockDb);
  });

  it("lists platforms ordered", async () => {
    const platforms = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        igdbPlatformId: 6,
        name: "PC (Windows)",
        abbreviation: "PC",
        slug: "win",
        platformFamily: "PC",
        colorPrimary: "#6B7280",
        createdAt: new Date(),
      },
    ];

    mockSelectAllResult(mockDb, platforms);

    const result = await repository.list();

    expect(result).toEqual(platforms);
  });

  it("returns platform by id", async () => {
    const platform = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      igdbPlatformId: 6,
      name: "PC (Windows)",
      abbreviation: "PC",
      slug: "win",
      platformFamily: "PC",
      colorPrimary: "#6B7280",
      createdAt: new Date(),
    };

    mockSelectResult(mockDb, [platform]);

    const result = await repository.getById("550e8400-e29b-41d4-a716-446655440000");

    expect(result).toEqual(platform);
  });

  it("returns null when platform not found", async () => {
    mockSelectResult(mockDb, []);

    const result = await repository.getById("missing");

    expect(result).toBeNull();
  });

  it("propagates list errors", async () => {
    mockSelectAllError(mockDb, new Error("db down"));

    await expect(repository.list()).rejects.toThrow("db down");
  });

  it("propagates getById errors", async () => {
    mockSelectError(mockDb, new Error("db down"));

    await expect(repository.getById("plat-1")).rejects.toThrow("db down");
  });
});
