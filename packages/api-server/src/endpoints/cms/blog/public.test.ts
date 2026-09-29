import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestBlogPost } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "../pages/__fixtures__/section-data";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";

import { cmsBlogPublicApi } from "./public";

describe("cmsBlogPublicApi", () => {
  let publishedPost: Awaited<ReturnType<typeof createTestBlogPost>>;
  let draftPost: Awaited<ReturnType<typeof createTestBlogPost>>;

  beforeAll(async () => {
    await cleanupRaw.marketingBlogPost.deleteMany({
      where: { slug: { startsWith: "test-post-" } },
    });

    publishedPost = await createTestBlogPost({
      isPublished: true,
      publishedAt: new Date(),
    });

    draftPost = await createTestBlogPost({
      isPublished: false,
    });
  });

  afterAll(async () => {
    await cleanup(
      { table: "marketingBlogPost", id: publishedPost.id },
      { table: "marketingBlogPost", id: draftPost.id },
    );
  });

  describe("listPublished", () => {
    it("returns only published posts", async () => {
      const posts = await cmsBlogPublicApi.listPublished();

      const publishedIds = posts.map((p) => p.id);

      expect(publishedIds).toContain(publishedPost.id);
      expect(publishedIds).not.toContain(draftPost.id);
    });

    it("returns posts ordered by publishedAt desc", async () => {
      const olderPost = await createTestBlogPost({
        isPublished: true,
        publishedAt: new Date("2020-01-01"),
      });

      try {
        const posts = await cmsBlogPublicApi.listPublished();

        const testIds = [publishedPost.id, olderPost.id];
        const testPosts = posts.filter((p) => testIds.includes(p.id));

        expect(testPosts).toHaveLength(2);

        const first = testPosts[0];
        const second = testPosts[1];

        expect(first?.publishedAt.getTime()).toBeGreaterThan(second?.publishedAt.getTime() ?? 0);
      } finally {
        await cleanup({ table: "marketingBlogPost", id: olderPost.id });
      }
    });

    it("returns empty array when no published posts exist", async () => {
      await cleanup(
        { table: "marketingBlogPost", id: publishedPost.id },
        { table: "marketingBlogPost", id: draftPost.id },
      );

      try {
        const posts = await cmsBlogPublicApi.listPublished();

        const testSlugs = posts.filter((p) => p.slug.startsWith("test-post-"));

        expect(testSlugs).toHaveLength(0);
      } finally {
        publishedPost = await createTestBlogPost({
          isPublished: true,
          publishedAt: new Date(),
        });

        draftPost = await createTestBlogPost({
          isPublished: false,
        });
      }
    });
  });

  describe("getArticle", () => {
    let snapshot: MarketingPagesState;

    beforeAll(async () => {
      snapshot = await captureMarketingPagesState();
      await clearMarketingPagesState();
      await seedSectionsWithOverrides(FULL_SECTION_DATA);
    });

    afterAll(async () => {
      await restoreMarketingPagesState(snapshot);
    });

    it("returns full article data for valid published slug", async () => {
      const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);
      const grid = FULL_SECTION_DATA["blog:grid"];

      expect(article.post.id).toBe(publishedPost.id);
      expect(article.post.slug).toBe(publishedPost.slug);
      expect(article.post.title).toBe(publishedPost.title);
      expect(article.labels).toEqual({
        readMoreLabel: grid.readMoreLabel,
        minReadSuffix: grid.minReadSuffix,
        readArticleLabel: grid.readArticleLabel,
        notPublishedLabel: grid.notPublishedLabel,
      });
      expect(article.relatedSectionTitle).toBe(FULL_SECTION_DATA["blog:related"].title);
      expect(article.relatedPosts).toEqual([]);
    });

    it("relates a second published post of the same category", async () => {
      const sibling = await createTestBlogPost({
        isPublished: true,
        publishedAt: new Date("2021-01-01"),
        category: publishedPost.category,
      });

      try {
        const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);

        expect(article.relatedPosts.map((post) => post.id)).toEqual([sibling.id]);
      } finally {
        await cleanup({ table: "marketingBlogPost", id: sibling.id });
      }
    });

    it("throws NotFoundError for non-existent slug", async () => {
      await expect(cmsBlogPublicApi.getArticle("non-existent-slug-xyz-999")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError for unpublished article slug", async () => {
      await expect(cmsBlogPublicApi.getArticle(draftPost.slug)).rejects.toThrow(NotFoundError);
    });
  });
});
