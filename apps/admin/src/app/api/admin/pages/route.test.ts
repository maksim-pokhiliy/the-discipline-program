import { afterEach, describe, expect, it, vi } from "vitest";

import { type AuthenticatedHandler, type RouteHandler } from "@repo/api-routes/types";
import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { ERROR_CODES } from "@repo/errors";

const { getPages } = vi.hoisted(() => ({ getPages: vi.fn().mockResolvedValue([]) }));

vi.mock("@app/lib/server/auth", async () => {
  const { withPublicRoute } = await import("@repo/api-routes");

  return {
    withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
      withPublicRoute((request, context) => handler(request, context, "admin-1")),
  };
});
vi.mock("@repo/api-server/cms", () => ({ cmsPagesAdminApi: { getPages } }));
vi.mock("@repo/env/base", () => ({ baseEnv: {} }));

import { GET } from "./route";

const request = (query = ""): Request =>
  new Request(`https://admin.example.com/api/admin/pages${query}`);
const context = { params: Promise.resolve({}) };

afterEach(() => {
  vi.clearAllMocks();
});

describe("admin pages list GET", () => {
  it("passes the locale query to the page list", async () => {
    const response = await GET(request("?locale=uk"), context);

    expect(getPages).toHaveBeenCalledExactlyOnceWith("uk");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("answers English when the locale is omitted", async () => {
    const response = await GET(request(), context);

    expect(getPages).toHaveBeenCalledExactlyOnceWith(DEFAULT_LOCALE_CODE);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("refuses a malformed locale with 400", async () => {
    const response = await GET(request("?locale=UK"), context);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: ERROR_CODES.VALIDATION_ERROR },
    });
    expect(getPages).not.toHaveBeenCalled();
  });
});
