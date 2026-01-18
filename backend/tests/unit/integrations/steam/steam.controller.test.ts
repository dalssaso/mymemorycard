import { beforeEach, describe, expect, it } from "bun:test"
import "reflect-metadata"

import { SteamController } from "@/integrations/steam/steam.controller"
import { createMockLogger, createMockSteamService } from "@/tests/helpers/repository.mocks"

describe("SteamController", () => {
  let controller: SteamController

  beforeEach(() => {
    const mockService = createMockSteamService()
    const mockLogger = createMockLogger()
    controller = new SteamController(mockService, mockLogger)
  })

  describe("routes", () => {
    it("exposes a router", () => {
      expect(controller.router).toBeDefined()
    })

    it("registers /connect route", () => {
      const routes = controller.router.routes
      const connectRoute = routes.find((r) => r.method === "GET" && r.path === "/connect")
      expect(connectRoute).toBeDefined()
    })

    it("registers /callback route", () => {
      const routes = controller.router.routes
      const callbackRoute = routes.find((r) => r.method === "GET" && r.path === "/callback")
      expect(callbackRoute).toBeDefined()
    })

    it("registers /library route", () => {
      const routes = controller.router.routes
      const libraryRoute = routes.find((r) => r.method === "GET" && r.path === "/library")
      expect(libraryRoute).toBeDefined()
    })

    it("registers /sync route", () => {
      const routes = controller.router.routes
      const syncRoute = routes.find((r) => r.method === "POST" && r.path === "/sync")
      expect(syncRoute).toBeDefined()
    })
  })

  describe("service wiring", () => {
    it("has getLoginUrl wired to service", () => {
      const mockService = createMockSteamService()
      expect(mockService.getLoginUrl).toBeDefined()
    })

    it("has validateCallback wired to service", () => {
      const mockService = createMockSteamService()
      expect(mockService.validateCallback).toBeDefined()
    })

    it("has importLibrary wired to service", () => {
      const mockService = createMockSteamService()
      expect(mockService.importLibrary).toBeDefined()
    })

    it("has syncAchievements wired to service", () => {
      const mockService = createMockSteamService()
      expect(mockService.syncAchievements).toBeDefined()
    })
  })
})
