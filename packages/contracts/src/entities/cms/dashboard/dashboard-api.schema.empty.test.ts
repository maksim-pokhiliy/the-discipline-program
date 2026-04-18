import { describe, expect, it } from "vitest";

import { getDashboardDataResponseSchema } from "./dashboard-api.schema";

describe("dashboard-api schema empty payloads", () => {
  it("getDashboardDataResponseSchema accepts all zero counts and empty recentActivity", () => {
    const result = getDashboardDataResponseSchema.safeParse({
      contentStats: {
        products: { total: 0, active: 0, inactive: 0 },
        reviews: { total: 0, active: 0 },
        blogPosts: { total: 0, published: 0, drafts: 0, featured: 0 },
        contactSubmissions: { total: 0, new: 0, processed: 0 },
      },
      userStats: { total: 0, newThisMonth: 0 },
      recentActivity: [],
    });

    expect(result.success).toBe(true);
  });

  it("getDashboardDataResponseSchema rejects negative counts", () => {
    const result = getDashboardDataResponseSchema.safeParse({
      contentStats: {
        products: { total: -1, active: 0, inactive: 0 },
        reviews: { total: 0, active: 0 },
        blogPosts: { total: 0, published: 0, drafts: 0, featured: 0 },
        contactSubmissions: { total: 0, new: 0, processed: 0 },
      },
      userStats: { total: 0, newThisMonth: 0 },
      recentActivity: [],
    });

    expect(result.success).toBe(false);
  });

  it("getDashboardDataResponseSchema rejects missing recentActivity", () => {
    const result = getDashboardDataResponseSchema.safeParse({
      contentStats: {
        products: { total: 0, active: 0, inactive: 0 },
        reviews: { total: 0, active: 0 },
        blogPosts: { total: 0, published: 0, drafts: 0, featured: 0 },
        contactSubmissions: { total: 0, new: 0, processed: 0 },
      },
      userStats: { total: 0, newThisMonth: 0 },
    });

    expect(result.success).toBe(false);
  });

  it("getDashboardDataResponseSchema rejects null", () => {
    const result = getDashboardDataResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
