import { describe, expect, it } from "vitest";

import { getProductsPageDataResponseSchema, getProductsResponseSchema } from "./product-api.schema";

describe("product-api schema empty payloads", () => {
  it("getProductsResponseSchema accepts empty array", () => {
    const result = getProductsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getProductsResponseSchema rejects null", () => {
    const result = getProductsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getProductsPageDataResponseSchema accepts empty products list", () => {
    const result = getProductsPageDataResponseSchema.safeParse({ products: [] });

    expect(result.success).toBe(true);
  });

  it("getProductsPageDataResponseSchema rejects missing products key", () => {
    const result = getProductsPageDataResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
