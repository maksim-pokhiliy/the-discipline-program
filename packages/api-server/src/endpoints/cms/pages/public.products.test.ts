import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanup, createTestProduct } from "../../../test/helpers";
import { seedLocaleCatalog } from "../locale/__fixtures__/locale-catalog";
import {
  FIRST_TRANSLATION,
  PHOTO,
  SECOND_TRANSLATION,
  TRANSLATION_WORDS,
  seedProductTranslation,
  seedTranslationProduct,
} from "../product/__fixtures__/translations";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { cmsPagesPublicApi } from "./public";

const ID_PREFIX = `ct9order${crypto.randomUUID().replaceAll("-", "")}`;
const EARLIER_DATE = new Date("1900-01-01T10:00:00.000Z");
const TIED_DATE = new Date("1900-01-02T10:00:00.000Z");
const HIDDEN_DATE = new Date("1899-01-01T10:00:00.000Z");
const DELETED_AT = new Date("1900-01-03T10:00:00.000Z");
const PRODUCT_READERS = [
  { name: "home", read: async () => (await cmsPagesPublicApi.getHomePage()).productsList },
  {
    name: "storefront",
    read: async () => (await cmsPagesPublicApi.getStorefrontProgramsPage()).productsList,
  },
  { name: "contact", read: async () => (await cmsPagesPublicApi.getContactPage()).programOptions },
];

describe("public product reads — order", () => {
  const rows: { table: string; id: string }[] = [];
  const ownSlugs = new Set<string>();
  let expectedSlugs: string[] = [];

  const seedProduct = async (
    suffix: string,
    createdAt: Date,
    overrides: Partial<Prisma.ProductUncheckedCreateInput> = {},
  ) => {
    const id = `${ID_PREFIX}${suffix}`;
    const product = await createTestProduct({ id, createdAt, ...overrides });

    rows.push({ table: "product", id: product.id });
    ownSlugs.add(product.slug);

    return product;
  };

  beforeAll(async () => {
    const larger = await seedProduct("z", TIED_DATE);
    const earlier = await seedProduct("middle", EARLIER_DATE);
    const smaller = await seedProduct("a", TIED_DATE);

    expectedSlugs = [earlier.slug, smaller.slug, larger.slug];

    await seedProduct("inactive", HIDDEN_DATE, { isActive: false });
    await seedProduct("deleted", HIDDEN_DATE, { deletedAt: DELETED_AT });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanup(...rows);
  });

  it.each(PRODUCT_READERS)("$name reads products by createdAt, then id", async ({ read }) => {
    const products = await read();
    const slugs = products.map(({ slug }) => slug).filter((slug) => ownSlugs.has(slug));

    expect(slugs).toEqual(expectedSlugs);
  });

  it.each(PRODUCT_READERS)("$name reads products with one query", async ({ read }) => {
    const productQueries = vi.spyOn(prisma.product, "findMany");

    await read();

    expect(productQueries).toHaveBeenCalledTimes(1);
  });
});

const LOCALIZED_READERS = [
  {
    name: "home",
    read: async (locale: LocaleCode) => (await cmsPagesPublicApi.getHomePage(locale)).productsList,
  },
  {
    name: "storefront",
    read: async (locale: LocaleCode) =>
      (await cmsPagesPublicApi.getStorefrontProgramsPage(locale)).productsList,
  },
];
const ALL_LOCALIZED_READERS = [
  ...LOCALIZED_READERS,
  {
    name: "contact",
    read: async (locale: LocaleCode) =>
      (await cmsPagesPublicApi.getContactPage(locale)).programOptions,
  },
];
const PUBLIC_PRODUCT_KEYS = [
  "id",
  "slug",
  "title",
  "description",
  "features",
  "imageUrl",
  "isFeatured",
  "isActive",
  "prices",
  "createdAt",
  "updatedAt",
];

describe("public product reads — per language", () => {
  let snapshot: MarketingPagesState;
  let liveId: string;
  let draftId: string;
  let untranslatedId: string;
  const rows: { table: string; id: string }[] = [];
  const hiddenSlugs = new Set<string>();
  const seed = async (overrides: Parameters<typeof seedTranslationProduct>[0] = {}) => {
    const product = await seedTranslationProduct({ createdAt: EARLIER_DATE, ...overrides });

    rows.push({ table: "product", id: product.id });

    return product;
  };

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    const live = await seed({ prices: { create: { amountCents: 9900 } } });
    const draft = await seed();
    const untranslated = await seed();
    const hidden = await seed({ isActive: false });
    const deleted = await seed({ deletedAt: DELETED_AT });

    liveId = live.id;
    draftId = draft.id;
    untranslatedId = untranslated.id;
    hiddenSlugs.add(hidden.slug);
    hiddenSlugs.add(deleted.slug);
    await seedProductTranslation(live.id);
    await seedProductTranslation(draft.id, { isActive: false });
    await seedProductTranslation(hidden.id);
    await seedProductTranslation(deleted.id);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await cleanup(...rows);
    await restoreMarketingPagesState(snapshot);
  });

  it.each(LOCALIZED_READERS)(
    "$name serves a live translation whole with the English price and photo",
    async ({ read }) => {
      const english = (await read("en")).find(({ id }) => id === liveId);
      const translated = (await read("uk")).find(({ id }) => id === liveId);

      expect(english?.prices).toHaveLength(1);
      expect(translated).toEqual({
        ...english,
        title: TRANSLATION_WORDS.title,
        description: TRANSLATION_WORDS.description,
        features: [FIRST_TRANSLATION.text, SECOND_TRANSLATION.text],
        imageUrl: PHOTO,
      });
    },
  );

  it.each(LOCALIZED_READERS)(
    "$name serves a draft and a product without a translation in English",
    async ({ read }) => {
      const english = await read("en");
      const localized = await read("uk");

      for (const productId of [draftId, untranslatedId]) {
        const original = english.find(({ id }) => id === productId);

        expect(original).toBeDefined();
        expect(localized.find(({ id }) => id === productId)).toEqual(original);
      }
    },
  );

  it.each(ALL_LOCALIZED_READERS)(
    "$name never serves a hidden or deleted product's translation",
    async ({ read }) => {
      expect((await read("uk")).some(({ slug }) => hiddenSlugs.has(slug))).toBe(false);
    },
  );

  it("contact options take the live translation's title and fall back for draft and missing rows", async () => {
    const english = (await cmsPagesPublicApi.getContactPage("en")).programOptions;
    const translated = (await cmsPagesPublicApi.getContactPage("uk")).programOptions;
    const product = await prisma.product.findUniqueOrThrow({ where: { id: liveId } });

    expect(translated.find(({ slug }) => slug === product.slug)).toEqual({
      slug: product.slug,
      title: TRANSLATION_WORDS.title,
    });
    expect(translated.filter(({ slug }) => slug !== product.slug)).toEqual(
      english.filter(({ slug }) => slug !== product.slug),
    );
  });

  it.each(LOCALIZED_READERS)("$name keeps English unchanged but for imageUrl", async ({ read }) => {
    const english = (await read("en")).find(({ id }) => id === liveId);

    expect(english).toMatchObject({
      title: "English title",
      description: "English description",
      features: ["First English feature", "Second English feature"],
      imageUrl: PHOTO,
    });
    expect(Object.keys(english ?? {}).sort()).toEqual([...PUBLIC_PRODUCT_KEYS].sort());
  });

  it.each(ALL_LOCALIZED_READERS)(
    "$name uses one product query and no direct translation query per language",
    async ({ read }) => {
      const products = vi.spyOn(prisma.product, "findMany");
      const translations = vi.spyOn(prisma.productTranslation, "findMany");

      await read("en");
      expect(products).toHaveBeenCalledTimes(1);
      products.mockClear();
      await read("uk");
      expect(products).toHaveBeenCalledTimes(1);
      expect(translations).not.toHaveBeenCalled();
    },
  );

  it.each(ALL_LOCALIZED_READERS)(
    "$name keeps product order in another language",
    async ({ read }) => {
      expect((await read("uk")).map(({ slug }) => slug)).toEqual(
        (await read("en")).map(({ slug }) => slug),
      );
    },
  );

  it.each(ALL_LOCALIZED_READERS)(
    "$name answers 404 for a disabled or unknown language",
    async ({ read }) => {
      await expect(read("de")).rejects.toThrow(NotFoundError);
      await expect(read("xx")).rejects.toThrow(NotFoundError);
    },
  );

  it.each(LOCALIZED_READERS)(
    "$name serves the stored live words until a translation is saved again",
    async ({ read }) => {
      const product = await seed();

      await seedProductTranslation(product.id);
      await prisma.product.update({
        where: { id: product.id },
        data: { featureList: [{ id: "new-feature", text: "A newer English feature" }] },
      });

      expect((await read("uk")).find(({ id }) => id === product.id)).toMatchObject({
        title: TRANSLATION_WORDS.title,
        description: TRANSLATION_WORDS.description,
        features: [FIRST_TRANSLATION.text, SECOND_TRANSLATION.text],
      });
    },
  );
});
