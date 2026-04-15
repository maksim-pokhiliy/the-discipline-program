import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { type BlogPostPageData, type PublicBlogPost } from "@repo/contracts/cms/blog";
import {
  PageSlug,
  PAGE_SECTIONS_MAP,
  SECTION_SCHEMAS,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { isPublishedPost, mapToPublicBlogPost } from "../../../mappers/cms";

const extractSectionData = <TKey extends SectionSchemaKey>(
  sections: { section: string; data: Prisma.JsonValue }[],
  sectionName: TKey,
): z.infer<(typeof SECTION_SCHEMAS)[TKey]> => {
  const section = sections.find((s) => s.section === sectionName);

  if (!section) {
    throw new NotFoundError(`Required section '${sectionName}' missing in database`);
  }

  return SECTION_SCHEMAS[sectionName].parse(section.data);
};

export const cmsBlogPublicApi = {
  listPublished: async (): Promise<PublicBlogPost[]> => {
    const posts = await prisma.marketingBlogPost.findMany({
      where: { isPublished: true, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });

    return posts.filter(isPublishedPost).map(mapToPublicBlogPost);
  },

  getArticle: async (slug: string): Promise<BlogPostPageData> => {
    const [post, sections] = await Promise.all([
      prisma.marketingBlogPost.findFirst({
        where: {
          slug,
          isPublished: true,
          publishedAt: { not: null },
        },
      }),
      prisma.marketingPageSection.findMany({
        where: { pageSlug: PageSlug.BLOG, isActive: true },
      }),
    ]);

    if (!post || !isPublishedPost(post)) {
      throw new NotFoundError(`Article not found: ${slug}`, { slug });
    }

    const publicPost = mapToPublicBlogPost(post);

    const relatedPostsRaw = await prisma.marketingBlogPost.findMany({
      where: {
        isPublished: true,
        category: post.category,
        id: { not: post.id },
        publishedAt: { not: null },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    });

    const relatedPosts = relatedPostsRaw.filter(isPublishedPost).map(mapToPublicBlogPost);
    const relatedSection = extractSectionData(sections, PAGE_SECTIONS_MAP.blog.related);
    const gridSection = extractSectionData(sections, PAGE_SECTIONS_MAP.blog.grid);

    return {
      post: publicPost,
      relatedPosts,
      relatedSectionTitle: relatedSection.title,
      labels: {
        readMoreLabel: gridSection.readMoreLabel,
        minReadSuffix: gridSection.minReadSuffix,
        readArticleLabel: gridSection.readArticleLabel,
        notPublishedLabel: gridSection.notPublishedLabel,
      },
    };
  },
};
