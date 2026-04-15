import { describe, expect, it } from "vitest";

import { pageSlugRouteParamsSchema } from "./pages-api.schema";
import { PageSlug } from "./pages.constants";

describe("pageSlugRouteParamsSchema", () => {
  it.each(Object.values(PageSlug))("accepts known page slug: %s", (slug) => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug });

    expect(result.success).toBe(true);
  });

  it("rejects unknown slug string", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: "pricing" });

    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: "" });

    expect(result.success).toBe(false);
  });

  it("rejects missing slug field", () => {
    const result = pageSlugRouteParamsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects numeric slug", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: 123 });

    expect(result.success).toBe(false);
  });
});
