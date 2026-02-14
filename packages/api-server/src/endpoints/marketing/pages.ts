import { type Prisma } from "@prisma/client";

import type { BlogPostPageData } from "@repo/contracts";
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
import { isPublishedPost, mapToPublicBlogPost, mapToReview, mapToProduct } from "../../mappers";

const extractSectionData = <TPageData>(
  sections: { section: string; data: Prisma.JsonValue }[],
  sectionName: string,
): TPageData => {
  const section = sections.find((s) => s.section === sectionName);

  if (!section) {
    throw new NotFoundError(`Required section '${sectionName}' missing in database`);
  }

  return section.data as TPageData;
};

export const pagesApi = {
  getHomePage: async (): Promise<HomePageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "home", isActive: true },
    });

    const [products, reviews] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        include: { prices: { where: { isActive: true } } },
      }),
      prisma.marketingReview.findMany({ where: { isActive: true, deletedAt: null } }),
    ]);

    const map = PAGE_SECTIONS_MAP.home;

    return {
      hero: extractSectionData<HomePageData["hero"]>(sections, map.hero),
      whyChoose: extractSectionData<HomePageData["whyChoose"]>(sections, map.whyChoose),
      storefront: extractSectionData<HomePageData["storefront"]>(sections, map.storefront),
      reviews: extractSectionData<HomePageData["reviews"]>(sections, map.reviews),
      contact: extractSectionData<HomePageData["contact"]>(sections, map.contact),
      productsList: products.map(mapToProduct),
      reviewsList: reviews.map(mapToReview),
    };
  },

  getStorefrontProgramsPage: async (): Promise<StorefrontProgramsPageData> => {
    const [sections, products] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: "storefront", isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        include: { prices: { where: { isActive: true } } },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.storefront;

    return {
      hero: extractSectionData<StorefrontProgramsPageData["hero"]>(sections, map.hero),
      cta: extractSectionData<StorefrontProgramsPageData["cta"]>(sections, map.cta),
      productsList: products.map(mapToProduct),
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
        where: { isPublished: true, publishedAt: { not: null }, deletedAt: null },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const publicPosts = posts.filter(isPublishedPost).map(mapToPublicBlogPost);

    return {
      hero: extractSectionData<BlogPageData["hero"]>(sections, PAGE_SECTIONS_MAP.blog.hero),
      featuredPost: publicPosts.find((p) => p.isFeatured) || publicPosts[0],
      posts: publicPosts,
      categories: [...new Set(publicPosts.map((p) => p.category))],
    };
  },

  getContactPage: async (): Promise<ContactPageData> => {
    const [sections, products] = await Promise.all([
      prisma.marketingPageSection.findMany({
        where: { pageSlug: "contact", isActive: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.contact;

    return {
      hero: extractSectionData<ContactPageData["hero"]>(sections, map.hero),
      form: extractSectionData<ContactPageData["form"]>(sections, map.form),
      directContact: extractSectionData<ContactPageData["directContact"]>(
        sections,
        map.directContact,
      ),
      faq: extractSectionData<ContactPageData["faq"]>(sections, map.faq),
      programOptions: products.map((p) => ({ value: p.slug, label: p.title })),
    };
  },

  getBlogArticle: async (slug: string): Promise<BlogPostPageData> => {
    const post = await prisma.marketingBlogPost.findFirst({
      where: {
        slug,
        isPublished: true,
        publishedAt: { not: null },
        deletedAt: null,
      },
    });

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
        deletedAt: null,
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    });

    const relatedPosts = relatedPostsRaw.filter(isPublishedPost).map(mapToPublicBlogPost);

    return {
      post: publicPost,
      relatedPosts,
    };
  },
};
