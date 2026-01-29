import { type Prisma, type MarketingBlogPost } from "@prisma/client";

import type { BlogPostPageData, PublicBlogPost } from "@repo/contracts";
import {
  type HomePageData,
  type StorefrontProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
  PAGE_SECTIONS_MAP,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

type PublishedPost = MarketingBlogPost & { publishedAt: Date };

function hasPublishedDate(post: MarketingBlogPost): post is PublishedPost {
  return post.publishedAt !== null;
}

const mapToPublicBlogPost = (post: PublishedPost): PublicBlogPost => {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    isFeatured: post.isFeatured,
    readTime: post.readTime,
    authorName: post.authorName,
    category: post.category,
    tags: post.tags,
  };
};

const extractSectionData = <TPageData>(
  sections: { section: string; data: Prisma.JsonValue }[],
  sectionName: string,
): TPageData => {
  const section = sections.find((s) => s.section === sectionName);

  if (!section) {
    throw new Error(`Required section '${sectionName}' missing in database`);
  }

  return section.data as TPageData;
};

export const pagesApi = {
  getHomePage: async (): Promise<HomePageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "home", isActive: true },
    });

    const [programs, reviews] = await Promise.all([
      prisma.marketingStorefrontProgram.findMany({ where: { isActive: true } }),
      prisma.marketingReview.findMany({ where: { isActive: true } }),
    ]);

    const map = PAGE_SECTIONS_MAP.home;

    return {
      hero: extractSectionData<HomePageData["hero"]>(sections, map.hero),
      whyChoose: extractSectionData<HomePageData["whyChoose"]>(sections, map.whyChoose),
      storefront: extractSectionData<HomePageData["storefront"]>(sections, map.storefront),
      reviews: extractSectionData<HomePageData["reviews"]>(sections, map.reviews),
      contact: extractSectionData<HomePageData["contact"]>(sections, map.contact),
      storefrontProgramsList: programs,
      reviewsList: reviews,
    };
  },

  getStorefrontProgramsPage: async (): Promise<StorefrontProgramsPageData> => {
    const [sections, programs] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: "storefront", isActive: true } }),
      prisma.marketingStorefrontProgram.findMany({ where: { isActive: true } }),
    ]);

    return {
      hero: extractSectionData<StorefrontProgramsPageData["hero"]>(
        sections,
        PAGE_SECTIONS_MAP.storefront.hero,
      ),
      programsList: programs,
    };
  },

  getAboutPage: async (): Promise<AboutPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "about", isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.about;

    return {
      hero: extractSectionData<AboutPageData["hero"]>(sections, map.hero),
      journey: extractSectionData<AboutPageData["journey"]>(sections, map.journey),
      credentials: extractSectionData<AboutPageData["credentials"]>(sections, map.credentials),
      personal: extractSectionData<AboutPageData["personal"]>(sections, map.personal),
      cta: extractSectionData<AboutPageData["cta"]>(sections, map.cta),
    };
  },

  getBlogPage: async (): Promise<BlogPageData> => {
    const [sections, posts] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: "blog", isActive: true } }),
      prisma.marketingBlogPost.findMany({
        where: { isPublished: true, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const publicPosts = posts.filter(hasPublishedDate).map(mapToPublicBlogPost);

    return {
      hero: extractSectionData<BlogPageData["hero"]>(sections, PAGE_SECTIONS_MAP.blog.hero),
      featuredPost: publicPosts.find((p) => p.isFeatured) || publicPosts[0],
      posts: publicPosts,
      categories: [...new Set(publicPosts.map((p) => p.category))],
    };
  },

  getContactPage: async (): Promise<ContactPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "contact", isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.contact;

    return {
      hero: extractSectionData<ContactPageData["hero"]>(sections, map.hero),
      form: extractSectionData<ContactPageData["form"]>(sections, map.form),
      directContact: extractSectionData<ContactPageData["directContact"]>(
        sections,
        map.directContact,
      ),
      faq: extractSectionData<ContactPageData["faq"]>(sections, map.faq),
    };
  },

  getBlogArticle: async (slug: string): Promise<BlogPostPageData> => {
    const post = await prisma.marketingBlogPost.findFirst({
      where: {
        slug,
        isPublished: true,
        publishedAt: { not: null },
      },
    });

    if (!post || !hasPublishedDate(post)) {
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

    const relatedPosts = relatedPostsRaw.filter(hasPublishedDate).map(mapToPublicBlogPost);

    return {
      post: publicPost,
      relatedPosts,
    };
  },
};
