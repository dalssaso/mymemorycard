import { describe, expect, it, vi } from "vitest"
import { authAPI, gamesAPI, importAPI } from "@/lib/api"
import { AuthService } from "@/shared/api/generated/services/AuthService"

describe("API Client", () => {
  describe("authAPI", () => {
    it("uses generated auth client", async () => {
      const loginSpy = vi
        .spyOn(AuthService, "postApiV1AuthLogin")
        .mockResolvedValue({ user: { id: "1", username: "user", email: "u@example.com" }, token: "t" })
      const registerSpy = vi
        .spyOn(AuthService, "postApiV1AuthRegister")
        .mockResolvedValue({ user: { id: "2", username: "user", email: "u@example.com" }, token: "t" })
      const meSpy = vi
        .spyOn(AuthService, "getApiV1AuthMe")
        .mockResolvedValue({ user: { id: "3", username: "user", email: "u@example.com" } })

      await authAPI.login({ username: "user", password: "pass" })
      await authAPI.register({ username: "user", email: "u@example.com", password: "pass" })
      await authAPI.me()

      expect(loginSpy).toHaveBeenCalledWith({
        requestBody: { username: "user", password: "pass" },
      })
      expect(registerSpy).toHaveBeenCalledWith({
        requestBody: { username: "user", email: "u@example.com", password: "pass" },
      })
      expect(meSpy).toHaveBeenCalledWith()

      loginSpy.mockRestore()
      registerSpy.mockRestore()
      meSpy.mockRestore()
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
