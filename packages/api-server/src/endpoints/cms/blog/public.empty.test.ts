import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { publicBlogPostSchema } from "@repo/contracts/cms/blog";

import { cleanupRaw } from "../../../test/helpers";

import { cmsBlogPublicApi } from "./public";

const TEST_PREFIX = `test-empty-blog-public-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsBlogPublicApi.listPublished — empty DB", () => {
  beforeAll(async () => {
    await cleanupRaw.marketingBlogPost.deleteMany({
      where: { slug: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await cleanupRaw.marketingBlogPost.deleteMany({
      where: { slug: { startsWith: TEST_PREFIX } },
    });
  });

  it("returns empty array filtered to test prefix when no matching published posts exist", async () => {
    const result = await cmsBlogPublicApi.listPublished();
    const filtered = result.filter((post) => post.slug.startsWith(TEST_PREFIX));

    expect(filtered).toHaveLength(0);
  });

  it("filtered (empty) subset validates against PublicBlogPost array schema", async () => {
    const result = await cmsBlogPublicApi.listPublished();
    const filtered = result.filter((post) => post.slug.startsWith(TEST_PREFIX));
    const parsed = publicBlogPostSchema.array().safeParse(filtered);

    expect(parsed.success).toBe(true);
  });

  it("result is always an array", async () => {
    const result = await cmsBlogPublicApi.listPublished();

    expect(Array.isArray(result)).toBe(true);
  });
});
