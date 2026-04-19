import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PAGE_SECTIONS_MAP } from "@repo/contracts/cms/pages";

import { cleanupRaw, createTestBlogPost } from "../../../test/helpers";
import { PARTIAL_SECTION_DATA } from "../pages/__fixtures__/section-data";
import {
  restoreSections,
  seedSectionsWithOverrides,
  type SectionState,
} from "../pages/__fixtures__/seed-with-overrides";

import { cmsBlogPublicApi } from "./public";

describe("cmsBlogPublicApi — partial DB (blog sections partially filled)", () => {
  let states: SectionState[] = [];
  let createdPageIds: string[] = [];
  let publishedPost: Awaited<ReturnType<typeof createTestBlogPost>>;

  beforeAll(async () => {
    await cleanupRaw.marketingBlogPost.deleteMany({
      where: { slug: { startsWith: "test-post-partial-" } },
    });

    publishedPost = await createTestBlogPost({
      slug: `test-post-partial-${crypto.randomUUID()}`,
      isPublished: true,
      publishedAt: new Date(),
    });

    ({ states, createdPageIds } = await seedSectionsWithOverrides({
      [PAGE_SECTIONS_MAP.blog.related]: PARTIAL_SECTION_DATA["blog:related"],
      [PAGE_SECTIONS_MAP.blog.grid]: PARTIAL_SECTION_DATA["blog:grid"],
    }));
  });

  afterAll(async () => {
    await cleanupRaw.marketingBlogPost.delete({ where: { id: publishedPost.id } }).catch(() => {});
    await restoreSections(states, createdPageIds);
  });

  it("getArticle returns result when blog sections have partial data", async () => {
    const article = await cmsBlogPublicApi.getArticle(publishedPost.slug);

    expect(article.post.id).toBe(publishedPost.id);
    expect(article.relatedSectionTitle).toBe("Partial Related Articles");
    expect(article.labels.readMoreLabel).toBe("Read more");
  });
});
