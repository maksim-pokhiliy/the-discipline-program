import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getReviewsPageDataResponseSchema,
  getReviewsResponseSchema,
} from "@repo/contracts/cms/review";

import { cleanupRaw } from "../../../test/helpers";

import { cmsReviewAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-review-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsReviewAdminApi — empty DB", () => {
  beforeAll(async () => {
    await cleanupRaw.marketingReview.deleteMany({
      where: { authorName: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await cleanupRaw.marketingReview.deleteMany({
      where: { authorName: { startsWith: TEST_PREFIX } },
    });
  });

  describe("getReviews", () => {
    it("returns empty array filtered to test prefix when no matching reviews exist", async () => {
      const result = await cmsReviewAdminApi.getReviews();
      const filtered = result.filter((review) => review.authorName.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("filtered (empty) subset validates against reviews response schema", async () => {
      const result = await cmsReviewAdminApi.getReviews();
      const filtered = result.filter((review) => review.authorName.startsWith(TEST_PREFIX));
      const parsed = getReviewsResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });

  describe("getReviewsPageData", () => {
    it("returns page data with empty reviews list filtered to test prefix", async () => {
      const result = await cmsReviewAdminApi.getReviewsPageData();
      const filtered = result.reviews.filter((review) => review.authorName.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("page data always has a reviews array", async () => {
      const result = await cmsReviewAdminApi.getReviewsPageData();

      expect(Array.isArray(result.reviews)).toBe(true);
    });

    it("page data with filtered (empty) reviews validates against response schema", async () => {
      const result = await cmsReviewAdminApi.getReviewsPageData();
      const filtered = {
        reviews: result.reviews.filter((review) => review.authorName.startsWith(TEST_PREFIX)),
      };
      const parsed = getReviewsPageDataResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });
});
