import { type Prisma, type Product as PrismaProduct } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { InternalServerError } from "@repo/errors";

import { mapToAdminProduct, mapToPublicProduct, parseFeatureList } from "./product.mapper";

const FEATURES = [
  { id: "second", text: "Second text" },
  { id: "first", text: "First text" },
];
const PRODUCT: PrismaProduct & { prices: [] } = {
  id: "clh3am8hi0000qwer1234abcd",
  slug: "mapper-product",
  title: "Product title",
  description: "Product description",
  featureList: FEATURES,
  imageUrl: null,
  wordsUpdatedAt: new Date("2026-01-01"),
  isActive: true,
  isFeatured: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
  prices: [],
};
const INVALID_LISTS: Prisma.JsonValue[] = [
  null,
  {},
  ["legacy text"],
  [{ text: "Missing id" }],
  [{ id: "", text: "Empty id" }],
  [{ id: "first", text: null }],
];

describe("parseFeatureList", () => {
  it("keeps stored feature ids, text and order", () => {
    expect(parseFeatureList(FEATURES, PRODUCT.id)).toEqual(FEATURES);
    expect(parseFeatureList([], PRODUCT.id)).toEqual([]);
  });

  it.each(INVALID_LISTS.map((value) => ({ value })))(
    "refuses malformed stored JSON $value",
    ({ value }) => {
      expect(() => parseFeatureList(value, PRODUCT.id)).toThrow(InternalServerError);
      expect(() => parseFeatureList(value, PRODUCT.id)).toThrow(
        "A stored feature list does not match its shape",
      );
      try {
        parseFeatureList(value, PRODUCT.id);
      } catch (error) {
        expect(error).toMatchObject({
          details: { productId: PRODUCT.id, issues: expect.any(Array) },
        });
      }
    },
  );
});

describe("product mappers", () => {
  it.each([null, "https://synthetic.public.blob.vercel-storage.com/products/mapped.jpg"])(
    "keeps the shared photo in admin and public mappings: %s",
    (imageUrl) => {
      const row = { ...PRODUCT, imageUrl };

      expect(mapToAdminProduct(row).imageUrl).toBe(imageUrl);
      expect(mapToPublicProduct(row).imageUrl).toBe(imageUrl);
    },
  );

  it("maps admin features as rows", () => {
    expect(mapToAdminProduct(PRODUCT).features).toEqual(FEATURES);
  });

  it("maps public features as strings in stored order", () => {
    expect(mapToPublicProduct(PRODUCT).features).toEqual(["Second text", "First text"]);
  });
});
