import { describe, expect, it } from "vitest";

import {
  adminPageDetailsSchema,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "./pages-api.schema";
import { PageSlug } from "./pages.constants";

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
        modalDismissLabel: "cancel",
        modalActionLabel: "buy",
      },
      cta: ctaStub,
      productsList: [],
    });

    expect(result.success).toBe(true);
  });

  it("getStorefrontProgramsPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getStorefrontProgramsPageResponseSchema.safeParse({
      hero: null,
      grid: null,
      cta: null,
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
      posts: [],
      categories: [],
    });

    expect(result.success).toBe(true);
  });

  it("getBlogPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getBlogPageResponseSchema.safeParse({
      hero: null,
      grid: null,
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
      programOptions: [],
    });

    expect(result.success).toBe(true);
  });

  it("getContactPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getContactPageResponseSchema.safeParse({
      hero: null,
      form: null,
      programOptions: [],
    });

    expect(result.success).toBe(true);
  });

  it("getFaqPageResponseSchema accepts empty items", () => {
    const result = getFaqPageResponseSchema.safeParse({
      hero: heroStub,
      content: { ...titleSubtitleStub, items: [] },
      cta: ctaStub,
    });

    expect(result.success).toBe(true);
  });

  it("getFaqPageResponseSchema accepts null sections (cold DB scenario)", () => {
    const result = getFaqPageResponseSchema.safeParse({
      hero: null,
      content: null,
      cta: null,
    });

    expect(result.success).toBe(true);
  });

  it("adminPageDetailsSchema accepts empty sections array", () => {
    const result = adminPageDetailsSchema.safeParse({
      slug: PageSlug.HOME,
      sections: [],
    });

    expect(result.success).toBe(true);
  });

  it("adminPageDetailsSchema rejects missing sections key", () => {
    const result = adminPageDetailsSchema.safeParse({ slug: PageSlug.HOME });

    expect(result.success).toBe(false);
  });
});
