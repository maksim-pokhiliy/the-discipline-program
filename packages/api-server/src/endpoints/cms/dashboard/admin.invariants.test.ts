import { describe, expect, it } from "vitest";

import { getDashboardDataResponseSchema } from "@repo/contracts/cms/dashboard";

import { cmsDashboardAdminApi } from "./admin";

const isFiniteNumber = (value: number): boolean =>
  typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);

const isNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && !Number.isNaN(value) && value >= 0;

describe("cmsDashboardAdminApi.getDashboardData — response invariants", () => {
  it("no numeric field is NaN, Infinity, or undefined", async () => {
    const { contentStats, userStats } = await cmsDashboardAdminApi.getDashboardData();

    const numericFields = [
      contentStats.products.total,
      contentStats.products.active,
      contentStats.products.inactive,
      contentStats.reviews.total,
      contentStats.reviews.active,
      contentStats.blogPosts.total,
      contentStats.blogPosts.published,
      contentStats.blogPosts.drafts,
      contentStats.blogPosts.featured,
      contentStats.contactSubmissions.total,
      contentStats.contactSubmissions.new,
      contentStats.contactSubmissions.processed,
      userStats.total,
      userStats.newThisMonth,
    ];

    for (const value of numericFields) {
      expect(isFiniteNumber(value)).toBe(true);
    }
  });

  it("each numeric count is an integer", async () => {
    const { contentStats, userStats } = await cmsDashboardAdminApi.getDashboardData();

    const numericFields = [
      contentStats.products.total,
      contentStats.products.active,
      contentStats.reviews.total,
      contentStats.reviews.active,
      contentStats.blogPosts.total,
      contentStats.blogPosts.published,
      contentStats.blogPosts.featured,
      contentStats.contactSubmissions.total,
      contentStats.contactSubmissions.new,
      userStats.total,
      userStats.newThisMonth,
    ];

    for (const value of numericFields) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("primary product/review/blog/contact/user counts are non-negative", async () => {
    const { contentStats, userStats } = await cmsDashboardAdminApi.getDashboardData();

    expect(isNonNegativeInteger(contentStats.products.total)).toBe(true);
    expect(isNonNegativeInteger(contentStats.products.active)).toBe(true);
    expect(isNonNegativeInteger(contentStats.reviews.total)).toBe(true);
    expect(isNonNegativeInteger(contentStats.reviews.active)).toBe(true);
    expect(isNonNegativeInteger(contentStats.blogPosts.total)).toBe(true);
    expect(isNonNegativeInteger(contentStats.blogPosts.published)).toBe(true);
    expect(isNonNegativeInteger(contentStats.blogPosts.featured)).toBe(true);
    expect(isNonNegativeInteger(contentStats.contactSubmissions.total)).toBe(true);
    expect(isNonNegativeInteger(contentStats.contactSubmissions.new)).toBe(true);
    expect(isNonNegativeInteger(userStats.total)).toBe(true);
    expect(isNonNegativeInteger(userStats.newThisMonth)).toBe(true);
  });

  it("contentStats.products.inactive equals total minus active", async () => {
    const { contentStats } = await cmsDashboardAdminApi.getDashboardData();

    expect(contentStats.products.inactive).toBe(
      contentStats.products.total - contentStats.products.active,
    );
  });

  it("contentStats.blogPosts.drafts equals total minus published", async () => {
    const { contentStats } = await cmsDashboardAdminApi.getDashboardData();

    expect(contentStats.blogPosts.drafts).toBe(
      contentStats.blogPosts.total - contentStats.blogPosts.published,
    );
  });

  it("contentStats.contactSubmissions.processed equals total minus new", async () => {
    const { contentStats } = await cmsDashboardAdminApi.getDashboardData();

    expect(contentStats.contactSubmissions.processed).toBe(
      contentStats.contactSubmissions.total - contentStats.contactSubmissions.new,
    );
  });

  it("userStats.newThisMonth never exceeds userStats.total", async () => {
    const { userStats } = await cmsDashboardAdminApi.getDashboardData();

    expect(userStats.newThisMonth).toBeLessThanOrEqual(userStats.total);
  });

  it("recentActivity is an array with length <= 10", async () => {
    const result = await cmsDashboardAdminApi.getDashboardData();

    expect(Array.isArray(result.recentActivity)).toBe(true);
    expect(result.recentActivity.length).toBeLessThanOrEqual(10);
  });

  it("response top-level shape matches schema (object keys + types)", async () => {
    const result = await cmsDashboardAdminApi.getDashboardData();
    const shape = getDashboardDataResponseSchema.shape;

    for (const key of Object.keys(shape)) {
      expect(result).toHaveProperty(key);
    }

    expect(typeof result.contentStats).toBe("object");
    expect(typeof result.userStats).toBe("object");
    expect(Array.isArray(result.recentActivity)).toBe(true);
  });
});
