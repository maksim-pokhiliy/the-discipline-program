import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import {
  adminPageDetailsSchema,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getOfferPageResponseSchema,
  getSitePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
  updatePageSectionBodySchema,
} from "./pages-api.schema";
import { PageSlug } from "./pages.constants";
import { SECTION_DEFAULTS } from "./section-defaults";

const heroStub = {
  title: "t",
  subtitle: "s",
  buttonText: "b",
  buttonHref: "/",
  backgroundImage: "/img",
};

const ctaStub = {
  title: "t",
  subtitle: "s",
  buttonText: "b",
  buttonHref: "/",
};

const titleSubtitleStub = { title: "t", subtitle: "s" };

const seoStub = { title: "t", description: "d" };

describe("pages-api schema empty collections", () => {
  it("getHomePageResponseSchema accepts empty productsList and reviewsList", () => {
    const result = getHomePageResponseSchema.safeParse({
      hero: heroStub,
      whyChoose: { ...titleSubtitleStub, features: [] },
      storefront: {
        ...titleSubtitleStub,
        buttonText: "b",
        buttonHref: "/",
        freeLabel: "free",
        cardActionLabel: "open",
        modalDismissLabel: "cancel",
        modalActionLabel: "buy",
      },
      reviews: titleSubtitleStub,
      contact: ctaStub,
      seo: seoStub,
      productsList: [],
      reviewsList: [],
    });

    expect(result.success).toBe(true);
  });

  it("getHomePageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getHomePageResponseSchema.safeParse({
      hero: null,
      whyChoose: null,
      storefront: null,
      reviews: null,
      contact: null,
      seo: null,
      productsList: [],
      reviewsList: [],
    });

    expect(result.success).toBe(true);
  });

  it("getHomePageResponseSchema rejects missing productsList", () => {
    const result = getHomePageResponseSchema.safeParse({
      hero: heroStub,
      whyChoose: { ...titleSubtitleStub, features: [] },
      reviews: titleSubtitleStub,
      contact: ctaStub,
      seo: seoStub,
      reviewsList: [],
    });

    expect(result.success).toBe(false);
  });

  it("getStorefrontProgramsPageResponseSchema accepts empty productsList", () => {
    const result = getStorefrontProgramsPageResponseSchema.safeParse({
      hero: heroStub,
      grid: {
        ...titleSubtitleStub,
        freeLabel: "free",
        cardActionLabel: "open",
        modalDismissLabel: "cancel",
        modalActionLabel: "buy",
      },
      cta: ctaStub,
      seo: seoStub,
      productsList: [],
    });

    expect(result.success).toBe(true);
  });

  it("getStorefrontProgramsPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getStorefrontProgramsPageResponseSchema.safeParse({
      hero: null,
      grid: null,
      cta: null,
      seo: null,
      productsList: [],
    });

    expect(result.success).toBe(true);
  });

  it("getAboutPageResponseSchema accepts empty timeline and credentials items", () => {
    const result = getAboutPageResponseSchema.safeParse({
      hero: heroStub,
      journey: { ...titleSubtitleStub, timeline: [] },
      credentials: { ...titleSubtitleStub, items: [] },
      personal: {
        ...titleSubtitleStub,
        description: "d",
        image: "https://example.com/img.png",
        name: "n",
        role: "r",
      },
      cta: ctaStub,
      seo: seoStub,
    });

    expect(result.success).toBe(true);
  });

  it("getAboutPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getAboutPageResponseSchema.safeParse({
      hero: null,
      journey: null,
      credentials: null,
      personal: null,
      cta: null,
      seo: null,
    });

    expect(result.success).toBe(true);
  });

  it("getBlogPageResponseSchema accepts empty posts and categories with no featuredPost", () => {
    const result = getBlogPageResponseSchema.safeParse({
      hero: { ...titleSubtitleStub },
      grid: {
        ...titleSubtitleStub,
        readMoreLabel: "read",
        minReadSuffix: "min",
        readArticleLabel: "read article",
        notPublishedLabel: "not published",
      },
      seo: seoStub,
      posts: [],
      categories: [],
    });

    expect(result.success).toBe(true);
  });

  it("getBlogPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getBlogPageResponseSchema.safeParse({
      hero: null,
      grid: null,
      seo: null,
      posts: [],
      categories: [],
    });

    expect(result.success).toBe(true);
  });

  it("getContactPageResponseSchema accepts empty programOptions", () => {
    const result = getContactPageResponseSchema.safeParse({
      hero: heroStub,
      form: {
        ...titleSubtitleStub,
        successTitle: "ok",
        successMessage: "ok",
        submitLabel: "submit",
        sendAnotherLabel: "again",
        sendingLabel: "sending",
        errorMessage: "oops",
        fieldLabels: { name: "n", contact: "c", program: "p", message: "m" },
        fieldPlaceholders: { contact: "c", message: "m" },
      },
      seo: seoStub,
      programOptions: [],
    });

    expect(result.success).toBe(true);
  });

  it("getContactPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getContactPageResponseSchema.safeParse({
      hero: null,
      form: null,
      seo: null,
      programOptions: [],
    });

    expect(result.success).toBe(true);
  });

  it("getFaqPageResponseSchema accepts empty items", () => {
    const result = getFaqPageResponseSchema.safeParse({
      hero: heroStub,
      content: { ...titleSubtitleStub, items: [] },
      cta: ctaStub,
      seo: seoStub,
    });

    expect(result.success).toBe(true);
  });

  it("getFaqPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getFaqPageResponseSchema.safeParse({
      hero: null,
      content: null,
      cta: null,
      seo: null,
    });

    expect(result.success).toBe(true);
  });

  it("getOfferPageResponseSchema accepts empty requisite rows and terms blocks", () => {
    const result = getOfferPageResponseSchema.safeParse({
      hero: titleSubtitleStub,
      requisites: { title: "t", items: [] },
      terms: { title: "t", blocks: [] },
      seo: seoStub,
    });

    expect(result.success).toBe(true);
  });

  it("getOfferPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getOfferPageResponseSchema.safeParse({
      hero: null,
      requisites: null,
      terms: null,
      seo: null,
    });

    expect(result.success).toBe(true);
  });

  it("getSitePageResponseSchema accepts the English defaults of the site sections", () => {
    const result = getSitePageResponseSchema.safeParse({
      navigation: SECTION_DEFAULTS["site:navigation"],
      footer: SECTION_DEFAULTS["site:footer"],
      leadForm: SECTION_DEFAULTS["site:leadForm"],
      errors: SECTION_DEFAULTS["site:errors"],
    });

    expect(result.success).toBe(true);
  });

  it("getSitePageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getSitePageResponseSchema.safeParse({
      navigation: null,
      footer: null,
      leadForm: null,
      errors: null,
    });

    expect(result.success).toBe(true);
  });

  it("refuses a page response without its seo key", () => {
    const result = getFaqPageResponseSchema.safeParse({ hero: null, content: null, cta: null });

    expect(result.success).toBe(false);
  });

  it("adminPageDetailsSchema accepts empty sections array", () => {
    const result = adminPageDetailsSchema.safeParse({
      slug: PageSlug.HOME,
      locale: DEFAULT_LOCALE_CODE,
      sections: [],
    });

    expect(result.success).toBe(true);
  });

  it("adminPageDetailsSchema rejects missing sections key", () => {
    const result = adminPageDetailsSchema.safeParse({
      slug: PageSlug.HOME,
      locale: DEFAULT_LOCALE_CODE,
    });

    expect(result.success).toBe(false);
  });

  it("adminPageDetailsSchema accepts section with empty data (bootstrap state)", () => {
    const result = adminPageDetailsSchema.safeParse({
      slug: PageSlug.HOME,
      locale: DEFAULT_LOCALE_CODE,
      sections: [
        {
          id: "clxxxxxxxxxxxxxxxxxxx",
          section: "home:hero",
          data: {},
          updatedAt: new Date(),
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("updatePageSectionBodySchema accepts partial section data", () => {
    const result = updatePageSectionBodySchema.safeParse({
      section: "home:hero",
      data: {},
    });

    expect(result.success).toBe(true);
  });

  it("updatePageSectionBodySchema accepts whyChoose with empty feature items", () => {
    const result = updatePageSectionBodySchema.safeParse({
      section: "home:whyChoose",
      data: {
        features: [
          { id: "550e8400-e29b-41d4-a716-446655440000", title: "", description: "", iconName: "" },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("updatePageSectionBodySchema accepts personal section with empty image string", () => {
    const result = updatePageSectionBodySchema.safeParse({
      section: "about:personal",
      data: { title: "Me", image: "" },
    });

    expect(result.success).toBe(true);
  });

  it("updatePageSectionBodySchema accepts contact form with partial fieldLabels", () => {
    const result = updatePageSectionBodySchema.safeParse({
      section: "contact:form",
      data: { fieldLabels: { name: "Name" } },
    });

    expect(result.success).toBe(true);
  });
});
