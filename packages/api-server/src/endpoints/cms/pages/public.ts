import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import {
  type HomePageData,
  type StorefrontProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
  type FaqPageData,
  type SectionSchemaKey,
  PageSlug,
  PAGE_SECTIONS_MAP,
  SECTION_SCHEMAS,
} from "@repo/contracts/cms/pages";

import { prisma } from "../../../db/client";
import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { mapToReview, mapToProduct } from "../../../mappers/cms";
import { cmsBlogPublicApi } from "../blog/public";

const extractSectionDataOrNull = <TKey extends SectionSchemaKey>(
  sections: { section: string; data: Prisma.JsonValue }[],
  sectionName: TKey,
): z.infer<(typeof SECTION_SCHEMAS)[TKey]> | null => {
  const section = sections.find((s) => s.section === sectionName);

  if (!section) {
    return null;
  }

  const result = SECTION_SCHEMAS[sectionName].safeParse(section.data);

  if (!result.success) {
    defaultMonitoring.captureException(result.error, {
      level: "warning",
      tags: { area: "cms.pages.public", section: sectionName },
      extra: { rawData: section.data },
    });

    return null;
  }

  return result.data;
};

export const cmsPagesPublicApi = {
  getHomePage: async (): Promise<HomePageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: PageSlug.HOME, isActive: true },
    });

    const [products, reviews] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
      }),
      prisma.marketingReview.findMany({ where: { isActive: true } }),
    ]);

    const map = PAGE_SECTIONS_MAP.home;

    return {
      hero: extractSectionDataOrNull(sections, map.hero),
      whyChoose: extractSectionDataOrNull(sections, map.whyChoose),
      storefront: extractSectionDataOrNull(sections, map.storefront),
      reviews: extractSectionDataOrNull(sections, map.reviews),
      contact: extractSectionDataOrNull(sections, map.contact),
      productsList: products.map(mapToProduct),
      reviewsList: reviews.map(mapToReview),
    };
  },

  getStorefrontProgramsPage: async (): Promise<StorefrontProgramsPageData> => {
    const [sections, products] = await Promise.all([
      prisma.marketingPageSection.findMany({
        where: { pageSlug: PageSlug.STOREFRONT, isActive: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.storefront;

    return {
      hero: extractSectionDataOrNull(sections, map.hero),
      grid: extractSectionDataOrNull(sections, map.grid),
      cta: extractSectionDataOrNull(sections, map.cta),
      productsList: products.map(mapToProduct),
    };
  },

  getAboutPage: async (): Promise<AboutPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: PageSlug.ABOUT, isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.about;

    return {
      hero: extractSectionDataOrNull(sections, map.hero),
      journey: extractSectionDataOrNull(sections, map.journey),
      credentials: extractSectionDataOrNull(sections, map.credentials),
      personal: extractSectionDataOrNull(sections, map.personal),
      cta: extractSectionDataOrNull(sections, map.cta),
    };
  },

  getBlogPage: async (): Promise<BlogPageData> => {
    const [sections, publicPosts] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: PageSlug.BLOG, isActive: true } }),
      cmsBlogPublicApi.listPublished(),
    ]);

    return {
      hero: extractSectionDataOrNull(sections, PAGE_SECTIONS_MAP.blog.hero),
      grid: extractSectionDataOrNull(sections, PAGE_SECTIONS_MAP.blog.grid),
      featuredPost: publicPosts.find((p) => p.isFeatured) || publicPosts[0],
      posts: publicPosts,
      categories: [...new Set(publicPosts.map((p) => p.category))],
    };
  },

  getContactPage: async (): Promise<ContactPageData> => {
    const [sections, products] = await Promise.all([
      prisma.marketingPageSection.findMany({
        where: { pageSlug: PageSlug.CONTACT, isActive: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.contact;

    return {
      hero: extractSectionDataOrNull(sections, map.hero),
      form: extractSectionDataOrNull(sections, map.form),
      programOptions: products.map((p) => ({ slug: p.slug, title: p.title })),
    };
  },

  getFaqPage: async (): Promise<FaqPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: PageSlug.FAQ, isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.faq;

    return {
      hero: extractSectionDataOrNull(sections, map.hero),
      content: extractSectionDataOrNull(sections, map.content),
      cta: extractSectionDataOrNull(sections, map.cta),
    };
  },
};
