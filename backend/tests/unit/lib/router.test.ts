/**
 * Unit Tests: Router
 *
 * Tests the Router class functionality without any external dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Router } from "@/lib/router";

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe("add", () => {
    it("should add a route", () => {
      const handler = async (): Promise<Response> => new Response("ok");
      router.add("GET", "/test", handler);

      const match = router.match("/test", "GET");
      expect(match).not.toBeNull();
      expect(match?.route.handler).toBe(handler);
    });

    it("should add route with auth requirement", () => {
      const handler = async (): Promise<Response> => new Response("ok");
      router.add("GET", "/protected", handler, true);

      const match = router.match("/protected", "GET");
      expect(match).not.toBeNull();
      expect(match?.route.requiresAuth).toBe(true);
    });
  });

  describe("HTTP method shortcuts", () => {
    it("should add GET route", () => {
      router.get("/test", async () => new Response("ok"));
      expect(router.match("/test", "GET")).not.toBeNull();
    });

    it("should add POST route", () => {
      router.post("/test", async () => new Response("ok"));
      expect(router.match("/test", "POST")).not.toBeNull();
    });

    it("should add PUT route", () => {
      router.put("/test", async () => new Response("ok"));
      expect(router.match("/test", "PUT")).not.toBeNull();
    });

    it("should add PATCH route", () => {
      router.patch("/test", async () => new Response("ok"));
      expect(router.match("/test", "PATCH")).not.toBeNull();
    });

    it("should add DELETE route", () => {
      router.delete("/test", async () => new Response("ok"));
      expect(router.match("/test", "DELETE")).not.toBeNull();
    });
  });

  describe("match", () => {
    it("should return null for non-matching path", () => {
      router.get("/test", async () => new Response("ok"));
      expect(router.match("/other", "GET")).toBeNull();
    });

    it("should return null for non-matching method", () => {
      router.get("/test", async () => new Response("ok"));
      expect(router.match("/test", "POST")).toBeNull();
    });

    it("should match exact paths", () => {
      router.get("/api/users", async () => new Response("ok"));

      const match = router.match("/api/users", "GET");
      expect(match).not.toBeNull();
    });

    it("should extract path parameters", () => {
      router.get("/api/users/:id", async () => new Response("ok"));

      const match = router.match("/api/users/123", "GET");
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ id: "123" });
    });

    it("should extract multiple path parameters", () => {
      router.get("/api/users/:userId/games/:gameId", async () => new Response("ok"));

      const match = router.match("/api/users/user1/games/game2", "GET");
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ userId: "user1", gameId: "game2" });
    });

    it("should not match partial paths", () => {
      router.get("/api/users", async () => new Response("ok"));
      expect(router.match("/api/users/123", "GET")).toBeNull();
    });

    it("should not match longer paths", () => {
      router.get("/api/users/:id", async () => new Response("ok"));
      expect(router.match("/api/users/123/extra", "GET")).toBeNull();
    });

    it("should match first registered route", () => {
      const handler1 = async (): Promise<Response> => new Response("first");
      const handler2 = async (): Promise<Response> => new Response("second");

      router.get("/test", handler1);
      router.get("/test", handler2);

      const match = router.match("/test", "GET");
      expect(match?.route.handler).toBe(handler1);
    });
  });
});
