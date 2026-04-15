import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PageSlug, PAGE_SECTIONS_MAP } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import { cmsPagesPublicApi } from "./public";

const HERO = (title: string) => ({
  title,
  subtitle: "Subtitle",
  buttonText: "Start",
  buttonHref: "/start",
  backgroundImage: "/bg.jpg",
});

const CTA = { title: "CTA", subtitle: "Subtitle", buttonText: "Start", buttonHref: "/start" };

describe("cmsPagesPublicApi", () => {
  const createdPages: string[] = [];
  const createdSections: string[] = [];

  const ensurePage = async (slug: string) => {
    const existing = await cleanupRaw.marketingPage.findUnique({ where: { slug } });

    if (existing) {
      return existing;
    }

    const page = await cleanupRaw.marketingPage.create({ data: { slug, title: slug } });

    createdPages.push(page.id);

    return page;
  };

  const ensureSection = async (pageSlug: string, section: string, data: Prisma.InputJsonValue) => {
    const existing = await cleanupRaw.marketingPageSection.findFirst({
      where: { pageSlug, section },
    });

    if (existing) {
      return existing;
    }

    const created = await cleanupRaw.marketingPageSection.create({
      data: { pageSlug, section, data },
    });

    createdSections.push(created.id);

    return created;
  };

  const seedPage = async (
    slug: string,
    sections: Record<string, Prisma.InputJsonValue>,
  ): Promise<boolean> => {
    try {
      await ensurePage(slug);

      for (const [section, data] of Object.entries(sections)) {
        await ensureSection(slug, section, data);
      }

      return true;
    } catch {
      return false;
    }
  };

  afterAll(async () => {
    for (const id of createdSections.reverse()) {
      await cleanupRaw.marketingPageSection.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdPages.reverse()) {
      await cleanupRaw.marketingPage.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("getHomePage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.home;

      seeded = await seedPage(PageSlug.HOME, {
        [map.hero]: HERO("Home"),
        [map.whyChoose]: { title: "Why choose", subtitle: "Subtitle", features: [] },
        [map.storefront]: {
          title: "Programs",
          subtitle: "Subtitle",
          buttonText: "View",
          buttonHref: "/programs",
          freeLabel: "Free",
          cardActionLabel: "Details",
          modalDismissLabel: "Cancel",
          modalActionLabel: "Sign up",
        },
        [map.reviews]: { title: "Reviews", subtitle: "Subtitle" },
        [map.contact]: {
          title: "Contact",
          subtitle: "Subtitle",
          buttonText: "Reach out",
          buttonHref: "/contact",
        },
      });
    });

    it("returns home page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getHomePage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getHomePage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("whyChoose");
      expect(data).toHaveProperty("storefront");
      expect(data).toHaveProperty("reviews");
      expect(data).toHaveProperty("contact");
      expect(Array.isArray(data.productsList)).toBe(true);
      expect(Array.isArray(data.reviewsList)).toBe(true);
    });
  });

  describe("getStorefrontProgramsPage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.storefront;

      seeded = await seedPage(PageSlug.STOREFRONT, {
        [map.hero]: HERO("Storefront"),
        [map.grid]: {
          title: "Programs",
          subtitle: "Subtitle",
          freeLabel: "Free",
          modalDismissLabel: "Cancel",
          modalActionLabel: "Sign up",
        },
        [map.cta]: CTA,
      });
    });

    it("returns storefront page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getStorefrontProgramsPage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("grid");
      expect(data).toHaveProperty("cta");
      expect(Array.isArray(data.productsList)).toBe(true);
    });
  });

  describe("getAboutPage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.about;

      seeded = await seedPage(PageSlug.ABOUT, {
        [map.hero]: HERO("About"),
        [map.journey]: { title: "Journey", subtitle: "Subtitle", timeline: [] },
        [map.credentials]: { title: "Credentials", subtitle: "Subtitle", items: [] },
        [map.personal]: {
          title: "Personal",
          subtitle: "Subtitle",
          description: "Bio text",
          image: "https://example.com/photo.jpg",
          name: "Coach",
          role: "Head Coach",
        },
        [map.cta]: CTA,
      });
    });

    it("returns about page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getAboutPage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getAboutPage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("journey");
      expect(data).toHaveProperty("credentials");
      expect(data).toHaveProperty("personal");
      expect(data).toHaveProperty("cta");
    });
  });

  describe("getBlogPage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.blog;

      seeded = await seedPage(PageSlug.BLOG, {
        [map.hero]: { title: "Blog", subtitle: "Subtitle" },
        [map.grid]: {
          title: "Grid",
          subtitle: "Subtitle",
          readMoreLabel: "Read more",
          minReadSuffix: "min read",
          readArticleLabel: "Read article",
          notPublishedLabel: "Not published",
        },
      });
    });

    it("returns blog page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getBlogPage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getBlogPage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("grid");
      expect(Array.isArray(data.posts)).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
    });
  });

  describe("getContactPage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.contact;

      seeded = await seedPage(PageSlug.CONTACT, {
        [map.hero]: HERO("Contact"),
        [map.form]: {
          title: "Form",
          subtitle: "Subtitle",
          successTitle: "Sent",
          successMessage: "We will get back to you",
          submitLabel: "Send",
          sendAnotherLabel: "Send another",
          sendingLabel: "Sending...",
          errorMessage: "Something went wrong",
          fieldLabels: { name: "Name", contact: "Contact", program: "Program", message: "Message" },
          fieldPlaceholders: { contact: "Email or phone", message: "Your message" },
        },
      });
    });

    it("returns contact page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getContactPage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getContactPage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("form");
      expect(Array.isArray(data.programOptions)).toBe(true);
    });
  });

  describe("getFaqPage", () => {
    let seeded = false;

    beforeAll(async () => {
      const map = PAGE_SECTIONS_MAP.faq;

      seeded = await seedPage(PageSlug.FAQ, {
        [map.hero]: HERO("FAQ"),
        [map.content]: { title: "Content", subtitle: "Subtitle", items: [] },
        [map.cta]: CTA,
      });
    });

    it("returns faq page data with expected shape", async () => {
      if (!seeded) {
        await expect(cmsPagesPublicApi.getFaqPage()).rejects.toThrow(NotFoundError);

        return;
      }

      const data = await cmsPagesPublicApi.getFaqPage();

      expect(data).toHaveProperty("hero");
      expect(data).toHaveProperty("content");
      expect(data).toHaveProperty("cta");
    });
  });
});
