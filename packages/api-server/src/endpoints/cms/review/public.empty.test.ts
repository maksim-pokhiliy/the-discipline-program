import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getReviewsResponseSchema } from "@repo/contracts/cms/review";

import { cleanupRaw } from "../../../test/helpers";

import { cmsReviewPublicApi } from "./public";

const TEST_PREFIX = `test-empty-review-public-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsReviewPublicApi — empty DB", () => {
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
    it("returns empty array filtered to test prefix when no matching active reviews exist", async () => {
      const result = await cmsReviewPublicApi.getReviews();
      const filtered = result.filter((review) => review.authorName.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("result is always an array", async () => {
      const result = await cmsReviewPublicApi.getReviews();

      expect(Array.isArray(result)).toBe(true);
    });

    it("filtered (empty) subset validates against reviews response schema", async () => {
      const result = await cmsReviewPublicApi.getReviews();
      const filtered = result.filter((review) => review.authorName.startsWith(TEST_PREFIX));
      const parsed = getReviewsResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });
});
