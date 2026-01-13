import { describe, expect, it, vi } from "vitest"
import { authAPI, gamesAPI, importAPI } from "@/lib/api"
import { api } from "@/lib/api/axios"

describe("API Client", () => {
  describe("authAPI", () => {
    it("uses /v1 auth endpoints", () => {
      const postSpy = vi.spyOn(api, "post").mockResolvedValue({ data: {} })
      const getSpy = vi.spyOn(api, "get").mockResolvedValue({ data: {} })

      authAPI.login({ username: "user", password: "pass" })
      authAPI.register({ username: "user", email: "u@example.com", password: "pass" })
      authAPI.me()

      expect(postSpy).toHaveBeenCalledWith("/v1/auth/login", expect.anything())
      expect(postSpy).toHaveBeenCalledWith("/v1/auth/register", expect.anything())
      expect(getSpy).toHaveBeenCalledWith("/v1/auth/me", expect.anything())

      postSpy.mockRestore()
      getSpy.mockRestore()
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
