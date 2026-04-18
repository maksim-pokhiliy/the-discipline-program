import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestBlogPost } from "../../../test/helpers";

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
    let blogPage: Awaited<ReturnType<typeof cleanupRaw.marketingPage.create>> | undefined;
    let gridSection: Awaited<ReturnType<typeof cleanupRaw.marketingPageSection.create>> | undefined;
    let relatedSection:
      | Awaited<ReturnType<typeof cleanupRaw.marketingPageSection.create>>
      | undefined;
    let heroSection: Awaited<ReturnType<typeof cleanupRaw.marketingPageSection.create>> | undefined;

    beforeAll(async () => {
      const existingPage = await cleanupRaw.marketingPage.findUnique({
        where: { slug: "blog" },
      });

      if (!existingPage) {
        blogPage = await cleanupRaw.marketingPage.create({
          data: {
            slug: "blog",
            title: "Blog",
          },
        });
      }

      const existingGrid = await cleanupRaw.marketingPageSection.findFirst({
        where: { pageSlug: "blog", section: "blog:grid" },
      });

      if (!existingGrid) {
        gridSection = await cleanupRaw.marketingPageSection.create({
          data: {
            pageSlug: "blog",
            section: "blog:grid",
            data: {
              title: "Test Blog",
              subtitle: "Test subtitle",
              readMoreLabel: "Read more",
              minReadSuffix: "min read",
              readArticleLabel: "Read article",
              notPublishedLabel: "Not published",
            },
          },
        });
      }

      const existingRelated = await cleanupRaw.marketingPageSection.findFirst({
        where: { pageSlug: "blog", section: "blog:related" },
      });

      if (!existingRelated) {
        relatedSection = await cleanupRaw.marketingPageSection.create({
          data: {
            pageSlug: "blog",
            section: "blog:related",
            data: {
              title: "Related articles",
            },
          },
        });
      }

      const existingHero = await cleanupRaw.marketingPageSection.findFirst({
        where: { pageSlug: "blog", section: "blog:hero" },
      });

      if (!existingHero) {
        heroSection = await cleanupRaw.marketingPageSection.create({
          data: {
            pageSlug: "blog",
            section: "blog:hero",
            data: {
              title: "Blog hero",
              subtitle: "Blog hero subtitle",
            },
          },
        });
      }
    });

    afterAll(async () => {
      const sectionsToDelete = [heroSection, gridSection, relatedSection].filter(
        (s): s is NonNullable<typeof s> => s !== undefined,
      );

      for (const section of sectionsToDelete) {
        await cleanupRaw.marketingPageSection.delete({ where: { id: section.id } }).catch(() => {});
      }

      if (blogPage) {
        await cleanupRaw.marketingPage.delete({ where: { id: blogPage.id } }).catch(() => {});
      }
    });

    it("returns full article data for valid published slug", async () => {
      const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);

      expect(article.post.id).toBe(publishedPost.id);
      expect(article.post.slug).toBe(publishedPost.slug);
      expect(article.post.title).toBe(publishedPost.title);
      expect(article.labels).toHaveProperty("readMoreLabel");
      expect(article.labels).toHaveProperty("minReadSuffix");
      expect(article.labels).toHaveProperty("readArticleLabel");
      expect(article.labels).toHaveProperty("notPublishedLabel");
      expect(article).toHaveProperty("relatedSectionTitle");
      expect(article).toHaveProperty("relatedPosts");
      expect(Array.isArray(article.relatedPosts)).toBe(true);
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
