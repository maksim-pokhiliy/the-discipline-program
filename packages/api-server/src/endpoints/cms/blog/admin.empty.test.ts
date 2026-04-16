import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { blogPostSchema, getBlogPageDataResponseSchema } from "@repo/contracts/cms/blog";

import { cleanupRaw } from "../../../test/helpers";

import { cmsBlogAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-blog-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsBlogAdminApi — empty DB", () => {
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

  describe("getPosts", () => {
    it("returns empty array filtered to test prefix when no matching posts exist", async () => {
      const result = await cmsBlogAdminApi.getPosts();
      const filtered = result.filter((post) => post.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("filtered (empty) subset validates against BlogPost array schema", async () => {
      const result = await cmsBlogAdminApi.getPosts();
      const filtered = result.filter((post) => post.slug.startsWith(TEST_PREFIX));
      const parsed = blogPostSchema.array().safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });

  describe("getBlogPageData", () => {
    it("returns page data with empty posts list filtered to test prefix", async () => {
      const result = await cmsBlogAdminApi.getBlogPageData();
      const filtered = result.posts.filter((post) => post.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("page data always has a posts array", async () => {
      const result = await cmsBlogAdminApi.getBlogPageData();

      expect(Array.isArray(result.posts)).toBe(true);
    });

    it("page data with filtered (empty) posts validates against response schema", async () => {
      const result = await cmsBlogAdminApi.getBlogPageData();
      const filtered = {
        posts: result.posts.filter((post) => post.slug.startsWith(TEST_PREFIX)),
      };
      const parsed = getBlogPageDataResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });
});
