import { afterEach, describe, expect, it, vi } from "vitest"
import { authAPI, gamesAPI, importAPI } from "@/lib/api"
import * as generated from "@/shared/api/generated"

describe("API Client", () => {
  describe("authAPI", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("uses generated auth client", async () => {
      const loginSpy = vi.spyOn(generated, "postApiV1AuthLogin").mockResolvedValue({
        data: { user: { id: "1", username: "user", email: "u@example.com" }, token: "t" },
      })
      const registerSpy = vi
        .spyOn(generated, "postApiV1AuthRegister")
        .mockResolvedValue({
          data: { user: { id: "2", username: "user", email: "u@example.com" }, token: "t" },
        })
      const meSpy = vi.spyOn(generated, "getApiV1AuthMe").mockResolvedValue({
        data: { user: { id: "3", username: "user", email: "u@example.com" } },
      })

      await authAPI.login({ username: "user", password: "pass" })
      await authAPI.register({ username: "user", email: "u@example.com", password: "pass" })
      await authAPI.me()

      expect(loginSpy).toHaveBeenCalledWith({
        body: { username: "user", password: "pass" },
        throwOnError: true,
      })
      expect(registerSpy).toHaveBeenCalledWith({
        body: { username: "user", email: "u@example.com", password: "pass" },
        throwOnError: true,
      })
      expect(meSpy).toHaveBeenCalledWith({ throwOnError: true })

    })

    it("should have register method", () => {
      expect(typeof authAPI.register).toBe("function")
    })

    it("should have login method", () => {
      expect(typeof authAPI.login).toBe("function")
    })

    it("should have me method", () => {
      expect(typeof authAPI.me).toBe("function")
    })
  });

  describe("gamesAPI", () => {
    it("should have getAll method", () => {
      expect(typeof gamesAPI.getAll).toBe("function")
    })

    it("should have getOne method", () => {
      expect(typeof gamesAPI.getOne).toBe("function")
    })

    it("should have updateStatus method", () => {
      expect(typeof gamesAPI.updateStatus).toBe("function")
    })

    it("should have updateRating method", () => {
      expect(typeof gamesAPI.updateRating).toBe("function")
    })
  });

  describe("importAPI", () => {
    it("should have bulk method", () => {
      expect(typeof importAPI.bulk).toBe("function")
    })
  });
})
