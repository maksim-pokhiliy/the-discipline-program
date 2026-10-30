/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthenticatedHandler, RouteHandler } from "@repo/api-routes/types";

const { updateSection, secret, marketingUrl } = vi.hoisted(() => ({
  updateSection: vi.fn().mockResolvedValue(undefined),
  secret: "test-revalidation-secret",
  marketingUrl: "https://marketing.example.com",
}));

vi.mock("@app/lib/server/auth", () => ({
  withAdminAuth:
    (handler: AuthenticatedHandler): RouteHandler =>
    (request, context) =>
      handler(request, context, "admin-1"),
}));

vi.mock("@repo/api-server/cms", () => ({
  cmsPagesAdminApi: { updateSection },
}));

vi.mock("@repo/env/base", () => ({
  baseEnv: { REVALIDATE_SECRET: secret, NEXT_PUBLIC_MARKETING_URL: marketingUrl },
}));

import { PATCH } from "./route";

describe("admin page sections PATCH revalidation", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it.each([
    {
      slug: "site",
      body: { section: "site:footer", data: { tagline: "T" } },
      query: { secret, path: "/", type: "layout" },
    },
    {
      slug: "offer",
      body: { section: "offer:seo", data: { title: "T" }, locale: "uk" },
      query: { secret, path: "/uk/offer" },
    },
  ])("sends the exact revalidation query for $slug", async ({ slug, body, query }) => {
    const response = await PATCH(
      new Request(`https://admin.example.com/api/admin/pages/${slug}/sections`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ slug }) },
    );

    expect(response.status).toBe(204);
    expect(updateSection).toHaveBeenCalledWith({
      ...body,
      pageSlug: slug,
      locale: body.locale ?? "en",
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [fetchedUrl] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];

    expect(typeof fetchedUrl).toBe("string");

    if (typeof fetchedUrl !== "string") {
      throw new Error("Expected a revalidation URL string");
    }

    expect(Object.fromEntries(new URL(fetchedUrl).searchParams)).toStrictEqual(query);
  });
});
