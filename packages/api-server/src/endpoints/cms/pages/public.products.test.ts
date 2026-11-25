import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../db/client";
import { cleanup, createTestProduct } from "../../../test/helpers";

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
