import { describe, expect, it } from "vitest";

import { getReviewsPageDataResponseSchema, getReviewsResponseSchema } from "./review-api.schema";

describe("review-api schema empty payloads", () => {
  it("getReviewsResponseSchema accepts empty array", () => {
    const result = getReviewsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getReviewsResponseSchema rejects null", () => {
    const result = getReviewsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getReviewsPageDataResponseSchema accepts empty reviews list", () => {
    const result = getReviewsPageDataResponseSchema.safeParse({ reviews: [] });

    expect(result.success).toBe(true);
  });

  it("getReviewsPageDataResponseSchema rejects missing reviews key", () => {
    const result = getReviewsPageDataResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
