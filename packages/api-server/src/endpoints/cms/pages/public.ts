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
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToReview, mapToProduct } from "../../../mappers/cms";
import { cmsBlogPublicApi } from "../blog/public";

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
      hero: extractSectionData(sections, map.hero),
      whyChoose: extractSectionData(sections, map.whyChoose),
      storefront: extractSectionData(sections, map.storefront),
      reviews: extractSectionData(sections, map.reviews),
      contact: extractSectionData(sections, map.contact),
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
      hero: extractSectionData(sections, map.hero),
      grid: extractSectionData(sections, map.grid),
      cta: extractSectionData(sections, map.cta),
      productsList: products.map(mapToProduct),
    };
  },

  getAboutPage: async (): Promise<AboutPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: PageSlug.ABOUT, isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.about;

    return {
      hero: extractSectionData(sections, map.hero),
      journey: extractSectionData(sections, map.journey),
      credentials: extractSectionData(sections, map.credentials),
      personal: extractSectionData(sections, map.personal),
      cta: extractSectionData(sections, map.cta),
    };
  },

  getBlogPage: async (): Promise<BlogPageData> => {
    const [sections, publicPosts] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: PageSlug.BLOG, isActive: true } }),
      cmsBlogPublicApi.listPublished(),
    ]);

    return {
      hero: extractSectionData(sections, PAGE_SECTIONS_MAP.blog.hero),
      grid: extractSectionData(sections, PAGE_SECTIONS_MAP.blog.grid),
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
      hero: extractSectionData(sections, map.hero),
      form: extractSectionData(sections, map.form),
      programOptions: products.map((p) => ({ value: p.slug, label: p.title })),
    };
  },

  getFaqPage: async (): Promise<FaqPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: PageSlug.FAQ, isActive: true },
    });

    const map = PAGE_SECTIONS_MAP.faq;

    return {
      hero: extractSectionData(sections, map.hero),
      content: extractSectionData(sections, map.content),
      cta: extractSectionData(sections, map.cta),
    };
  },
};
