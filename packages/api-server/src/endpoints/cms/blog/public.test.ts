import { MarketingBlogCategory } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestBlogPost } from "../../../test/helpers";
import { UKRAINIAN } from "../locale/__fixtures__/locale-catalog";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "../pages/__fixtures__/section-data";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";

import { cmsBlogPublicApi } from "./public";

const OTHER_CATEGORY = MarketingBlogCategory.FITNESS;
const BLOG_RELATED = PAGE_SECTIONS_MAP.blog.related;
const ENGLISH_RELATED_SECTION_KEY = {
  pageSlug_section_locale: {
    pageSlug: PageSlug.BLOG,
    section: BLOG_RELATED,
    locale: DEFAULT_LOCALE_CODE,
  },
};
const UK_BLOG_SECTIONS = {
  [PAGE_SECTIONS_MAP.blog.grid]: {
    readMoreLabel: "Читати далі",
    minReadSuffix: "хв читання",
    readArticleLabel: "Читати статтю",
    notPublishedLabel: "Не опубліковано",
  },
  [BLOG_RELATED]: { title: "Схожі статті" },
};

const removeUkrainianSections = async (): Promise<void> => {
  await cleanupRaw.marketingPageSection.deleteMany({ where: { locale: UKRAINIAN.code } });
  await cleanupRaw.marketingLocale.deleteMany({ where: { code: UKRAINIAN.code } });
};

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

    it("relates a second published post of the same category and not one of another category", async () => {
      const sibling = await createTestBlogPost({
        isPublished: true,
        publishedAt: new Date("2021-01-01"),
        category: publishedPost.category,
      });
      const stranger = await createTestBlogPost({
        isPublished: true,
        publishedAt: new Date("2021-01-02"),
        category: OTHER_CATEGORY,
      });

      try {
        const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);
        const relatedIds = article.relatedPosts.map((post) => post.id);

        expect(stranger.category).not.toBe(publishedPost.category);
        expect(relatedIds).toEqual([sibling.id]);
        expect(relatedIds).not.toContain(stranger.id);
      } finally {
        await cleanup(
          { table: "marketingBlogPost", id: sibling.id },
          { table: "marketingBlogPost", id: stranger.id },
        );
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

    it("reads the English grid and related labels when uk rows exist", async () => {
      await seedSectionsWithOverrides(UK_BLOG_SECTIONS, UKRAINIAN.code);

      try {
        const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);
        const grid = FULL_SECTION_DATA["blog:grid"];

        expect(article.labels).toEqual({
          readMoreLabel: grid.readMoreLabel,
          minReadSuffix: grid.minReadSuffix,
          readArticleLabel: grid.readArticleLabel,
          notPublishedLabel: grid.notPublishedLabel,
        });
        expect(article.relatedSectionTitle).toBe(FULL_SECTION_DATA["blog:related"].title);
      } finally {
        await removeUkrainianSections();
      }
    });

    it("refuses an article whose English related section is missing even when a uk one exists", async () => {
      await seedSectionsWithOverrides(UK_BLOG_SECTIONS, UKRAINIAN.code);
      await cleanupRaw.marketingPageSection.delete({ where: ENGLISH_RELATED_SECTION_KEY });

      try {
        const reading = cmsBlogPublicApi.getArticle(publishedPost.slug);

        await expect(reading).rejects.toThrow(NotFoundError);
        await expect(reading).rejects.toThrow(`Required section '${BLOG_RELATED}' missing`);
      } finally {
        await cleanupRaw.marketingPageSection.create({
          data: {
            pageSlug: PageSlug.BLOG,
            section: BLOG_RELATED,
            locale: DEFAULT_LOCALE_CODE,
            data: FULL_SECTION_DATA[BLOG_RELATED],
          },
        });
        await removeUkrainianSections();
      }
    });
  });
});
