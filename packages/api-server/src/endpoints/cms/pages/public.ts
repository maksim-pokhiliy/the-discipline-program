import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type HomePageData,
  type StorefrontProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
  type FaqPageData,
  type OfferPageData,
  type SitePageData,
  type SectionSchemaKey,
  PageSlug,
  PAGE_SECTIONS_MAP,
  SECTION_SCHEMAS,
} from "@repo/contracts/cms/pages";

import { prisma } from "../../../db/client";
import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { mapToReview, mapToProduct } from "../../../mappers/cms";
import { cmsBlogPublicApi } from "../blog/public";
import { assertPublicLocale } from "../locale/locale-access";

const HOME_PAGE_PRODUCTS_LIMIT = 6;
const HOME_PAGE_REVIEWS_LIMIT = 12;

type SectionRow = { section: string; locale: string; data: Prisma.JsonValue };

type SectionData<TKey extends SectionSchemaKey> = z.infer<
  ReturnType<(typeof SECTION_SCHEMAS)[TKey]["deepPartial"]>
>;

type SectionPicker = <TKey extends SectionSchemaKey>(sectionName: TKey) => SectionData<TKey> | null;

const extractSectionDataOrNull = <TKey extends SectionSchemaKey>(
  sections: SectionRow[],
  sectionName: TKey,
): SectionData<TKey> | null => {
  const section = sections.find((s) => s.section === sectionName);

  if (!section) {
    return null;
  }

  const result = SECTION_SCHEMAS[sectionName].deepPartial().safeParse(section.data);

  if (!result.success) {
    defaultMonitoring.captureException(result.error, {
      level: "warning",
      tags: { area: "cms.pages.public", section: sectionName, locale: section.locale },
      extra: { rawData: section.data },
    });

    return null;
  }

  const parsed = result.data as SectionData<TKey>;

  if (Object.keys(parsed).length === 0) {
    return null;
  }

  return parsed;
};

const localeChain = (locale: LocaleCode): LocaleCode[] =>
  locale === DEFAULT_LOCALE_CODE ? [DEFAULT_LOCALE_CODE] : [locale, DEFAULT_LOCALE_CODE];

const readSections = async (pageSlug: PageSlug, locale: LocaleCode): Promise<SectionPicker> => {
  const chain = localeChain(locale);
  const rows = await prisma.marketingPageSection.findMany({
    where: { pageSlug, isActive: true, locale: { in: chain } },
    select: { section: true, locale: true, data: true },
  });
  const rowsByLocale = chain.map((code) => rows.filter((row) => row.locale === code));

  return (sectionName) => {
    for (const localeRows of rowsByLocale) {
      const data = extractSectionDataOrNull(localeRows, sectionName);

      if (data !== null) {
        return data;
      }
    }

    return null;
  };
};

export const cmsPagesPublicApi = {
  getHomePage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<HomePageData> => {
    await assertPublicLocale(locale);

    const [pick, products, reviews] = await Promise.all([
      readSections(PageSlug.HOME, locale),
      prisma.product.findMany({
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
        take: HOME_PAGE_PRODUCTS_LIMIT,
      }),
      prisma.marketingReview.findMany({
        where: { isActive: true },
        take: HOME_PAGE_REVIEWS_LIMIT,
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.home;

    return {
      hero: pick(map.hero),
      whyChoose: pick(map.whyChoose),
      storefront: pick(map.storefront),
      reviews: pick(map.reviews),
      contact: pick(map.contact),
      seo: pick(map.seo),
      productsList: products.map(mapToProduct),
      reviewsList: reviews.map(mapToReview),
    };
  },

  getStorefrontProgramsPage: async (
    locale: LocaleCode = DEFAULT_LOCALE_CODE,
  ): Promise<StorefrontProgramsPageData> => {
    await assertPublicLocale(locale);

    const [pick, products] = await Promise.all([
      readSections(PageSlug.STOREFRONT, locale),
      prisma.product.findMany({
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.storefront;

    return {
      hero: pick(map.hero),
      grid: pick(map.grid),
      cta: pick(map.cta),
      seo: pick(map.seo),
      productsList: products.map(mapToProduct),
    };
  },

  getAboutPage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<AboutPageData> => {
    await assertPublicLocale(locale);

    const pick = await readSections(PageSlug.ABOUT, locale);
    const map = PAGE_SECTIONS_MAP.about;

    return {
      hero: pick(map.hero),
      journey: pick(map.journey),
      credentials: pick(map.credentials),
      personal: pick(map.personal),
      cta: pick(map.cta),
      seo: pick(map.seo),
    };
  },

  getBlogPage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<BlogPageData> => {
    await assertPublicLocale(locale);

    const [pick, publicPosts] = await Promise.all([
      readSections(PageSlug.BLOG, locale),
      cmsBlogPublicApi.listPublished(),
    ]);

    return {
      hero: pick(PAGE_SECTIONS_MAP.blog.hero),
      grid: pick(PAGE_SECTIONS_MAP.blog.grid),
      seo: pick(PAGE_SECTIONS_MAP.blog.seo),
      featuredPost: publicPosts.find((p) => p.isFeatured) || publicPosts[0],
      posts: publicPosts,
      categories: [...new Set(publicPosts.map((p) => p.category))],
    };
  },

  getContactPage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<ContactPageData> => {
    await assertPublicLocale(locale);

    const [pick, products] = await Promise.all([
      readSections(PageSlug.CONTACT, locale),
      prisma.product.findMany({
        where: { isActive: true },
      }),
    ]);

    const map = PAGE_SECTIONS_MAP.contact;

    return {
      hero: pick(map.hero),
      form: pick(map.form),
      seo: pick(map.seo),
      programOptions: products.map((p) => ({ slug: p.slug, title: p.title })),
    };
  },

  getFaqPage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<FaqPageData> => {
    await assertPublicLocale(locale);

    const pick = await readSections(PageSlug.FAQ, locale);
    const map = PAGE_SECTIONS_MAP.faq;

    return {
      hero: pick(map.hero),
      content: pick(map.content),
      cta: pick(map.cta),
      seo: pick(map.seo),
    };
  },

  getOfferPage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<OfferPageData> => {
    await assertPublicLocale(locale);

    const pick = await readSections(PageSlug.OFFER, locale);
    const map = PAGE_SECTIONS_MAP.offer;

    return {
      hero: pick(map.hero),
      requisites: pick(map.requisites),
      terms: pick(map.terms),
      seo: pick(map.seo),
    };
  },

  getSitePage: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<SitePageData> => {
    await assertPublicLocale(locale);

    const pick = await readSections(PageSlug.SITE, locale);
    const map = PAGE_SECTIONS_MAP.site;

    return {
      navigation: pick(map.navigation),
      footer: pick(map.footer),
      leadForm: pick(map.leadForm),
      errors: pick(map.errors),
    };
  },
};
