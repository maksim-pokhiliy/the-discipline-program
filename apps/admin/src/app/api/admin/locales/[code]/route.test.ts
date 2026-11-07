import { afterEach, describe, expect, it, vi } from "vitest";

import { type AuthenticatedHandler, type RouteHandler } from "@repo/api-routes/types";

const { updateLocale } = vi.hoisted(() => ({ updateLocale: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@app/lib/server/auth", async () => {
  const { withPublicRoute } = await import("@repo/api-routes");

  return {
    withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
      withPublicRoute((request, context) => handler(request, context, "admin-1")),
  };
});
vi.mock("@repo/api-server/cms", () => ({ cmsLocaleAdminApi: { updateLocale } }));
vi.mock("@repo/env/base", () => ({ baseEnv: {} }));

import { PATCH } from "./route";

const context = { params: Promise.resolve({ code: "uk" }) };
const request = (body: object): Request =>
  new Request("https://admin.example.com/api/admin/locales/uk", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

afterEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/admin/locales/[code]", () => {
  it("answers 400 for sortOrder without forwarding the update", async () => {
    const response = await PATCH(request({ sortOrder: 1 }), context);

    expect(response.status).toBe(400);
    expect(updateLocale).not.toHaveBeenCalled();
  });

  it("forwards the enabled flag and answers 204", async () => {
    const response = await PATCH(request({ isEnabled: true }), context);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(updateLocale).toHaveBeenCalledExactlyOnceWith("uk", { isEnabled: true });
  });
});
