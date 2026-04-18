import { afterAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup } from "../../../test/helpers";

import { cmsReviewAdminApi } from "./admin";

const baseReviewData = (overrides: Record<string, unknown> = {}) => ({
  authorName: "Test Reviewer",
  authorRole: null,
  authorAvatar: null,
  text: "This is a test review with enough characters",
  rating: 5,
  isActive: true,
  ...overrides,
});

describe("cmsReviewAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getReviews", () => {
    it("returns an array", async () => {
      const reviews = await cmsReviewAdminApi.getReviews();

      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe("createReview", () => {
    it("creates and returns mapped review", async () => {
      const data = baseReviewData();
      const review = await cmsReviewAdminApi.createReview(data);

      toCleanup.push({ table: "marketingReview", id: review.id });

      expect(review.id).toBeDefined();
      expect(review.authorName).toBe(data.authorName);
      expect(review.text).toBe(data.text);
      expect(review.rating).toBe(data.rating);
      expect(review.isActive).toBe(true);
      expect(review.createdAt).toBeInstanceOf(Date);
      expect(review.updatedAt).toBeInstanceOf(Date);
    });

    it("creates with all optional fields", async () => {
      const data = baseReviewData({
        authorRole: "Athlete",
        authorAvatar: "https://example.com/avatar.jpg",
        rating: 3,
        isActive: false,
      });
      const review = await cmsReviewAdminApi.createReview(data);

      toCleanup.push({ table: "marketingReview", id: review.id });

      expect(review.authorRole).toBe("Athlete");
      expect(review.authorAvatar).toBe("https://example.com/avatar.jpg");
      expect(review.rating).toBe(3);
      expect(review.isActive).toBe(false);
    });
  });

  describe("getReviewById", () => {
    it("returns review by ID", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData());

      toCleanup.push({ table: "marketingReview", id: created.id });

      const found = await cmsReviewAdminApi.getReviewById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.authorName).toBe(created.authorName);
      expect(found.text).toBe(created.text);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(cmsReviewAdminApi.getReviewById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateReview", () => {
    it("updates and returns review", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData());

      toCleanup.push({ table: "marketingReview", id: created.id });

      const updated = await cmsReviewAdminApi.updateReview(created.id, {
        authorName: "Updated Reviewer",
        rating: 2,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.authorName).toBe("Updated Reviewer");
      expect(updated.rating).toBe(2);
      expect(updated.text).toBe(created.text);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(
        cmsReviewAdminApi.updateReview("non-existent-id", { rating: 3 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteReview", () => {
    it("soft-deletes review (invisible after)", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData());

      toCleanup.push({ table: "marketingReview", id: created.id });

      await cmsReviewAdminApi.deleteReview(created.id);

      await expect(cmsReviewAdminApi.getReviewById(created.id)).rejects.toThrow(NotFoundError);
    });

    it("soft-deleted review excluded from getReviews list", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData());

      toCleanup.push({ table: "marketingReview", id: created.id });

      await cmsReviewAdminApi.deleteReview(created.id);

      const reviews = await cmsReviewAdminApi.getReviews();
      const ids = reviews.map((r) => r.id);

      expect(ids).not.toContain(created.id);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(cmsReviewAdminApi.deleteReview("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("toggleReviewStatus", () => {
    it("flips isActive from true to false", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData({ isActive: true }));

      toCleanup.push({ table: "marketingReview", id: created.id });

      const toggled = await cmsReviewAdminApi.toggleReviewStatus(created.id);

      expect(toggled.isActive).toBe(false);
    });

    it("flips isActive from false to true", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData({ isActive: false }));

      toCleanup.push({ table: "marketingReview", id: created.id });

      const toggled = await cmsReviewAdminApi.toggleReviewStatus(created.id);

      expect(toggled.isActive).toBe(true);
    });

    it("double toggle returns to original state", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData({ isActive: true }));

      toCleanup.push({ table: "marketingReview", id: created.id });

      await cmsReviewAdminApi.toggleReviewStatus(created.id);
      const toggledBack = await cmsReviewAdminApi.toggleReviewStatus(created.id);

      expect(toggledBack.isActive).toBe(true);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(cmsReviewAdminApi.toggleReviewStatus("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getReviewsPageData", () => {
    it("returns shape with reviews array", async () => {
      const pageData = await cmsReviewAdminApi.getReviewsPageData();

      expect(pageData).toHaveProperty("reviews");
      expect(Array.isArray(pageData.reviews)).toBe(true);
    });

    it("includes created review in page data", async () => {
      const created = await cmsReviewAdminApi.createReview(baseReviewData());

      toCleanup.push({ table: "marketingReview", id: created.id });

      const pageData = await cmsReviewAdminApi.getReviewsPageData();
      const ids = pageData.reviews.map((r) => r.id);

      expect(ids).toContain(created.id);
    });
  });
});
