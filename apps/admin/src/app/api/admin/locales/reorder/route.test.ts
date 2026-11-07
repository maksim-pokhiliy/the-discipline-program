import { afterEach, describe, expect, it, vi } from "vitest";

import { type AuthenticatedHandler, type RouteHandler } from "@repo/api-routes/types";

import { ENGLISH, POLISH, UKRAINIAN } from "@app/modules/languages/languages.fixtures";

const { reorderLocales } = vi.hoisted(() => ({ reorderLocales: vi.fn() }));

vi.mock("@app/lib/server/auth", async () => {
  const { withPublicRoute } = await import("@repo/api-routes");

  return {
    withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
      withPublicRoute((request, context) => handler(request, context, "admin-1")),
  };
});
vi.mock("@repo/api-server/cms", () => ({ cmsLocaleAdminApi: { reorderLocales } }));
vi.mock("@repo/env/base", () => ({ baseEnv: {} }));

import { PUT } from "./route";

const request = (orderedCodes: string[]): Request =>
  new Request("https://admin.example.com/api/admin/locales/reorder", {
    method: "PUT",
    body: JSON.stringify({ orderedCodes }),
  });

afterEach(() => {
  vi.clearAllMocks();
});

describe("PUT /api/admin/locales/reorder", () => {
  it("passes the parsed body and answers 200 with the full list", async () => {
    const list = [ENGLISH, POLISH, UKRAINIAN];

    reorderLocales.mockResolvedValueOnce(list);

    const response = await PUT(request([POLISH.code, UKRAINIAN.code]), {
      params: Promise.resolve({}),
    });

    expect(reorderLocales).toHaveBeenCalledExactlyOnceWith({
      orderedCodes: [POLISH.code, UKRAINIAN.code],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(JSON.parse(JSON.stringify(list)));
  });

  it.each([{ codes: ["en"] }, { codes: ["uk", "uk"] }, { codes: [] }])(
    "answers 400 without a write for $codes",
    async ({ codes }) => {
      const response = await PUT(request(codes), { params: Promise.resolve({}) });

      expect(response.status).toBe(400);
      expect(reorderLocales).not.toHaveBeenCalled();
    },
  );
});
