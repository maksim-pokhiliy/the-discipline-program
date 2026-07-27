import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DashboardActivityType } from "@repo/contracts/cms/dashboard";
import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanup,
  createTestContactSubmission,
  createTestProduct,
  createTestReview,
  createTestUser,
} from "../../../test/helpers";
import { iamUserAdminApi } from "../../iam/users-admin";

import { cmsDashboardAdminApi } from "./admin";

describe("cmsDashboardAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getDashboardData shape", () => {
    it("returns contentStats with products, reviews, blogPosts, contactSubmissions", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.contentStats).toHaveProperty("products");
      expect(data.contentStats.products).toHaveProperty("total");
      expect(data.contentStats.products).toHaveProperty("active");
      expect(data.contentStats.products).toHaveProperty("inactive");

      expect(data.contentStats).toHaveProperty("reviews");
      expect(data.contentStats.reviews).toHaveProperty("total");
      expect(data.contentStats.reviews).toHaveProperty("active");

      expect(data.contentStats).toHaveProperty("blogPosts");
      expect(data.contentStats.blogPosts).toHaveProperty("total");
      expect(data.contentStats.blogPosts).toHaveProperty("published");
      expect(data.contentStats.blogPosts).toHaveProperty("drafts");
      expect(data.contentStats.blogPosts).toHaveProperty("featured");

      expect(data.contentStats).toHaveProperty("contactSubmissions");
      expect(data.contentStats.contactSubmissions).toHaveProperty("total");
      expect(data.contentStats.contactSubmissions).toHaveProperty("new");
      expect(data.contentStats.contactSubmissions).toHaveProperty("processed");
    });

    it("returns userStats with total and newThisMonth", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.userStats).toHaveProperty("total");
      expect(data.userStats).toHaveProperty("newThisMonth");
      expect(data.userStats.total).toBeGreaterThanOrEqual(0);
      expect(data.userStats.newThisMonth).toBeGreaterThanOrEqual(0);
      expect(data.userStats.newThisMonth).toBeLessThanOrEqual(data.userStats.total);
    });

    it("returns recentActivity as array with max 10 items", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(Array.isArray(data.recentActivity)).toBe(true);
      expect(data.recentActivity.length).toBeLessThanOrEqual(10);
    });
  });

  describe("contentStats counts are consistent", () => {
    it("product totals are non-negative integers", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.contentStats.products.total).toBeGreaterThanOrEqual(0);
      expect(data.contentStats.products.active).toBeGreaterThanOrEqual(0);
      expect(data.contentStats.products.inactive).toBeGreaterThanOrEqual(0);
    });

    it("inactive product count equals total minus active", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.contentStats.products.inactive).toBe(
        data.contentStats.products.total - data.contentStats.products.active,
      );
    });

    it("blog post counts are non-negative integers", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.contentStats.blogPosts.total).toBeGreaterThanOrEqual(0);
      expect(data.contentStats.blogPosts.published).toBeGreaterThanOrEqual(0);
      expect(data.contentStats.blogPosts.drafts).toBeGreaterThanOrEqual(0);
    });
  });

  describe("userStats shape", () => {
    it("total and newThisMonth are non-negative integers", async () => {
      const data = await cmsDashboardAdminApi.getDashboardData();

      expect(data.userStats.total).toBeGreaterThanOrEqual(0);
      expect(data.userStats.newThisMonth).toBeGreaterThanOrEqual(0);
      expect(data.userStats.newThisMonth).toBeLessThanOrEqual(data.userStats.total);
    });
  });

  describe("recentActivity", () => {
    let productId: string;
    let reviewId: string;
    let contactId: string;
    let data: Awaited<ReturnType<typeof cmsDashboardAdminApi.getDashboardData>>;

    beforeAll(async () => {
      const product = await createTestProduct();

      toCleanup.push({ table: "product", id: product.id });
      productId = product.id;

      const review = await createTestReview();

      toCleanup.push({ table: "marketingReview", id: review.id });
      reviewId = review.id;

      const contact = await createTestContactSubmission();

      toCleanup.push({ table: "marketingContactSubmission", id: contact.id });
      contactId = contact.id;

      data = await cmsDashboardAdminApi.getDashboardData();
    });

    it("includes newly created items in activity feed", () => {
      const activityIds = data.recentActivity.map((a) => a.id);

      expect(activityIds).toContain(productId);
      expect(activityIds).toContain(reviewId);
      expect(activityIds).toContain(contactId);
    });

    it("activity items have correct types", () => {
      const productActivity = data.recentActivity.find((a) => a.id === productId);

      expect(productActivity?.type).toBe(DashboardActivityType.PROGRAM);

      const reviewActivity = data.recentActivity.find((a) => a.id === reviewId);

      expect(reviewActivity?.type).toBe(DashboardActivityType.REVIEW);

      const contactActivity = data.recentActivity.find((a) => a.id === contactId);

      expect(contactActivity?.type).toBe(DashboardActivityType.CONTACT);
    });

    it("activity items are sorted by date descending", () => {
      for (let i = 1; i < data.recentActivity.length; i++) {
        const prev = data.recentActivity[i - 1];
        const curr = data.recentActivity[i];

        if (!prev || !curr) {
          throw new Error("expected activity items to exist");
        }

        expect(prev.date.getTime()).toBeGreaterThanOrEqual(curr.date.getTime());
      }
    });

    it("each activity item has required fields", () => {
      for (const item of data.recentActivity) {
        expect(item.id).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.date).toBeInstanceOf(Date);
        expect(item.href).toBeDefined();
        expect(Object.values(DashboardActivityType)).toContain(item.type);
      }
    });
  });

  describe("soft-deleted users", () => {
    let adminActor: Awaited<ReturnType<typeof createTestUser>>;

    beforeAll(async () => {
      adminActor = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      toCleanup.push({ table: "user", id: adminActor.id });
    });

    it("drops the user from userStats.total and recentActivity after an admin delete", async () => {
      const target = await createTestUser();

      try {
        const before = await cmsDashboardAdminApi.getDashboardData();

        expect(before.recentActivity.some((a) => a.id === target.id)).toBe(true);

        await iamUserAdminApi.deleteUser(adminActor.id, target.id);

        const after = await cmsDashboardAdminApi.getDashboardData();

        expect(after.userStats.total).toBe(before.userStats.total - 1);
        expect(after.recentActivity.some((a) => a.id === target.id)).toBe(false);
      } finally {
        await cleanup({ table: "user", id: target.id });
      }
    });
  });
});
