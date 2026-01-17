import { describe, it, expect, vi, beforeEach } from "vitest";
import { GamesService, CredentialsService, PlatformsService, StoresService } from "../services";

vi.mock("../client");

describe("API Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GamesService", () => {
    it("should export search method", () => {
      expect(GamesService.search).toBeDefined();
    });

    it("should export list method", () => {
      expect(GamesService.list).toBeDefined();
    });

    it("should export getOne method", () => {
      expect(GamesService.getOne).toBeDefined();
    });

    it("should export create method for import", () => {
      expect(GamesService.create).toBeDefined();
    });

    it("should export update method", () => {
      expect(GamesService.update).toBeDefined();
    });

    it("should export delete method", () => {
      expect(GamesService.delete).toBeDefined();
    });
  });

  describe("CredentialsService", () => {
    it("should export list method", () => {
      expect(CredentialsService.list).toBeDefined();
    });

    it("should export create method", () => {
      expect(CredentialsService.create).toBeDefined();
    });

    it("should export validate method", () => {
      expect(CredentialsService.validate).toBeDefined();
    });

    it("should export delete method", () => {
      expect(CredentialsService.delete).toBeDefined();
    });
  });

  describe("PlatformsService", () => {
    it("should export list method", () => {
      expect(PlatformsService.list).toBeDefined();
    });

    it("should export getOne method", () => {
      expect(PlatformsService.getOne).toBeDefined();
    });
  });

  describe("StoresService", () => {
    it("should export list method", () => {
      expect(StoresService.list).toBeDefined();
    });
  });
});
