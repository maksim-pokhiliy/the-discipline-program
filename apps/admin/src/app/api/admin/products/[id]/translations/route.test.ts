import { afterEach, describe, expect, it, vi } from "vitest";

import { type AuthenticatedHandler, type RouteHandler } from "@repo/api-routes/types";

const { saveTranslation } = vi.hoisted(() => ({
  saveTranslation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@app/lib/server/auth", async () => {
  const { withPublicRoute } = await import("@repo/api-routes");

  return {
    withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
      withPublicRoute((request, context) => handler(request, context, "admin-1")),
  };
});
vi.mock("@repo/api-server/cms", () => ({ cmsProductTranslationAdminApi: { saveTranslation } }));
vi.mock("@repo/api-server/storage", () => ({ storageUploadAdminApi: { deleteImage: vi.fn() } }));
vi.mock("@repo/env/base", () => ({ baseEnv: {} }));

import { PATCH } from "./route";

const PRODUCT_ID = "clz00000000000000000prd1";
const BODY = {
  locale: "uk",
  title: "Translated title",
  description: "Translated description",
  features: [{ id: "first", text: "Translated feature" }],
};
const context = { params: Promise.resolve({ id: PRODUCT_ID }) };
const request = (body: object): Request =>
  new Request(`https://admin.example.com/api/admin/products/${PRODUCT_ID}/translations`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

afterEach(() => vi.clearAllMocks());

describe("PATCH /api/admin/products/[id]/translations", () => {
  it("saves only the language's words and answers 204 with no body", async () => {
    const response = await PATCH(
      request({
        ...BODY,
        slug: "discarded",
        imageUrl: null,
        isActive: false,
        price: { amountCents: 0 },
      }),
      context,
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(saveTranslation).toHaveBeenCalledExactlyOnceWith({ ...BODY, productId: PRODUCT_ID });
  });

  it("refuses malformed words before the service", async () => {
    expect((await PATCH(request({ ...BODY, locale: "UK" }), context)).status).toBe(400);
    expect((await PATCH(request({ ...BODY, features: [{ text: "No id" }] }), context)).status).toBe(
      400,
    );
    expect(saveTranslation).not.toHaveBeenCalled();
  });
});
