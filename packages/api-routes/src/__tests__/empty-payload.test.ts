import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createAuthGetByParamHandler,
  createAuthGetHandler,
  createAuthGetWithQueryHandler,
} from "../auth-factories";
import { createGetByIdHandler, createGetByParamHandler, createGetHandler } from "../route-helpers";
import type { RouteContext } from "../types";

const itemSchema = z.object({ id: z.string() });
const listSchema = z.array(itemSchema);
const paginatedSchema = z.object({
  items: listSchema,
  totalCount: z.number().int().nonnegative(),
});
const aggregateSchema = z.object({
  items: listSchema,
  summary: z.object({
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
  }),
});

const emptyContext: RouteContext = { params: Promise.resolve({}) };

const buildRequest = (url = "https://example.com/api/test"): Request => new Request(url);

describe("route handler factories — empty payloads", () => {
  describe("public factories", () => {
    it("createGetHandler returns 200 with empty array", async () => {
      const apiFn = vi.fn(async () => [] as Array<{ id: string }>);
      const handler = createGetHandler(apiFn, listSchema);

      const response = await handler();

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual([]);
      expect(listSchema.safeParse(body).success).toBe(true);
      expect(apiFn).toHaveBeenCalledOnce();
    });

    it("createGetHandler returns 200 with empty paginated payload", async () => {
      const apiFn = vi.fn(async () => ({ items: [], totalCount: 0 }));
      const handler = createGetHandler(apiFn, paginatedSchema);

      const response = await handler();

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual({ items: [], totalCount: 0 });
      expect(paginatedSchema.safeParse(body).success).toBe(true);
    });

    it("createGetByIdHandler forwards empty items on a valid id", async () => {
      const apiFn = vi.fn(async (_id: string) => ({ items: [], totalCount: 0 }));
      const paramsSchema = z.object({ id: z.string() });
      const handler = createGetByIdHandler(apiFn, paramsSchema, paginatedSchema);

      const context: RouteContext = { params: Promise.resolve({ id: "resource-1" }) };
      const response = await handler(buildRequest(), context);

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual({ items: [], totalCount: 0 });
      expect(apiFn).toHaveBeenCalledWith("resource-1");
    });

    it("createGetByParamHandler forwards empty aggregate payload", async () => {
      const apiFn = vi.fn(async (_params: { slug: string }) => ({
        items: [],
        summary: { total: 0, active: 0 },
      }));
      const paramsSchema = z.object({ slug: z.string() });
      const handler = createGetByParamHandler(apiFn, paramsSchema, aggregateSchema);

      const context: RouteContext = { params: Promise.resolve({ slug: "empty" }) };
      const response = await handler(buildRequest(), context);

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(aggregateSchema.safeParse(body).success).toBe(true);
      expect(apiFn).toHaveBeenCalledWith({ slug: "empty" });
    });
  });

  describe("authenticated factories", () => {
    it("createAuthGetHandler returns empty array for authenticated user", async () => {
      const apiFn = vi.fn(async (_userId: string) => [] as Array<{ id: string }>);
      const handler = createAuthGetHandler(apiFn, listSchema);

      const response = await handler(buildRequest(), emptyContext, "user-123");

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual([]);
      expect(listSchema.safeParse(body).success).toBe(true);
      expect(apiFn).toHaveBeenCalledWith("user-123");
    });

    it("createAuthGetHandler returns empty aggregate with zero summary", async () => {
      const apiFn = vi.fn(async (_userId: string) => ({
        items: [],
        summary: { total: 0, active: 0 },
      }));
      const handler = createAuthGetHandler(apiFn, aggregateSchema);

      const response = await handler(buildRequest(), emptyContext, "user-123");

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual({ items: [], summary: { total: 0, active: 0 } });
      expect(aggregateSchema.safeParse(body).success).toBe(true);
    });

    it("createAuthGetByParamHandler forwards empty list with params", async () => {
      const apiFn = vi.fn(
        async (_userId: string, _params: { planId: string }) => [] as Array<{ id: string }>,
      );
      const paramsSchema = z.object({ planId: z.string() });
      const handler = createAuthGetByParamHandler(apiFn, paramsSchema, listSchema);

      const context: RouteContext = { params: Promise.resolve({ planId: "plan-1" }) };
      const response = await handler(buildRequest(), context, "user-123");

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual([]);
      expect(apiFn).toHaveBeenCalledWith("user-123", { planId: "plan-1" });
    });

    it("createAuthGetWithQueryHandler returns empty paginated payload", async () => {
      const apiFn = vi.fn(async (_userId: string, _query: { page: string }) => ({
        items: [],
        totalCount: 0,
      }));
      const querySchema = z.object({ page: z.string() });
      const handler = createAuthGetWithQueryHandler(apiFn, querySchema, paginatedSchema);

      const response = await handler(
        buildRequest("https://example.com/api/test?page=1"),
        emptyContext,
        "user-123",
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();

      expect(body).toEqual({ items: [], totalCount: 0 });
      expect(paginatedSchema.safeParse(body).success).toBe(true);
      expect(apiFn).toHaveBeenCalledWith("user-123", { page: "1" });
    });
  });
});
