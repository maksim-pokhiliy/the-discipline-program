import { describe, expect, it } from "vitest";

import { getBlogPageDataResponseSchema, getBlogPostsResponseSchema } from "./blog-api.schema";

describe("blog-api schema empty payloads", () => {
  it("getBlogPostsResponseSchema accepts empty array", () => {
    const result = getBlogPostsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getBlogPostsResponseSchema rejects null", () => {
    const result = getBlogPostsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getBlogPostsResponseSchema rejects missing array", () => {
    const result = getBlogPostsResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getBlogPageDataResponseSchema accepts empty posts list", () => {
    const result = getBlogPageDataResponseSchema.safeParse({ posts: [] });

    expect(result.success).toBe(true);
  });

  it("getBlogPageDataResponseSchema rejects missing posts key", () => {
    const result = getBlogPageDataResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
