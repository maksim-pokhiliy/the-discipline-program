import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AuthenticatedHandler, type RouteHandler } from "@repo/api-routes/types";

import { makeProduct } from "@app/modules/products/products.fixtures";

const { getById } = vi.hoisted(() => ({ getById: vi.fn() }));

vi.mock("@app/lib/server/auth", async () => {
  const { withPublicRoute } = await import("@repo/api-routes");

  return {
    withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
      withPublicRoute((request, context) => handler(request, context, "admin-1")),
  };
});
vi.mock("@app/lib/server/cms-product-admin-api", () => ({
  cmsProductAdminApi: { getById, update: vi.fn(), delete: vi.fn() },
}));
vi.mock("@repo/env/base", () => ({ baseEnv: {} }));

import { GET } from "./route";

const PRODUCT = makeProduct([]);
const context = { params: Promise.resolve({ id: PRODUCT.id }) };
const request = (query = ""): Request =>
  new Request(`https://admin.example.com/api/admin/products/${PRODUCT.id}${query}`);

beforeEach(() => {
  getById.mockResolvedValue(PRODUCT);
});
afterEach(() => vi.clearAllMocks());

describe("GET /api/admin/products/[id]", () => {
  it("passes the locale and returns product details", async () => {
    const response = await GET(request("?locale=uk"), context);

    expect(getById).toHaveBeenCalledExactlyOnceWith(PRODUCT.id, "uk");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: PRODUCT.id, translation: null });
  });

  it("reads English when the locale is absent", async () => {
    expect((await GET(request(), context)).status).toBe(200);
    expect(getById).toHaveBeenCalledExactlyOnceWith(PRODUCT.id, "en");
  });

  it("refuses malformed locale and id before the service", async () => {
    expect((await GET(request("?locale=UK"), context)).status).toBe(400);
    expect((await GET(request(), { params: Promise.resolve({ id: "invalid" }) })).status).toBe(400);
    expect(getById).not.toHaveBeenCalled();
  });
});
