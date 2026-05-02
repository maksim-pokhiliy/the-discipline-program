import { afterEach, describe, expect, it } from "vitest";

import { cleanupRaw } from "../test/helpers";

import { prisma } from "./client";

describe("soft-delete extension: deleteMany with unique-field suffix (perf-011)", () => {
  const cleanup: { table: string; id: string }[] = [];

  afterEach(async () => {
    for (const { table, id } of cleanup.splice(0).reverse()) {
      const delegate = (
        cleanupRaw as unknown as Record<
          string,
          { delete: (args: { where: { id: string } }) => Promise<unknown> }
        >
      )[table];

      if (delegate) {
        await delegate.delete({ where: { id } }).catch(() => undefined);
      }
    }
  });

  it("User: bulk soft-delete suffixes email and shares one timestamp suffix across all rows", async () => {
    const namespace = crypto.randomUUID().slice(0, 8);
    const u1 = await cleanupRaw.user.create({
      data: { email: `softdel-a-${namespace}@test.local`, name: "A" },
    });
    const u2 = await cleanupRaw.user.create({
      data: { email: `softdel-b-${namespace}@test.local`, name: "B" },
    });
    const u3 = await cleanupRaw.user.create({
      data: { email: `softdel-c-${namespace}@test.local`, name: "C" },
    });

    cleanup.push(
      { table: "user", id: u1.id },
      { table: "user", id: u2.id },
      { table: "user", id: u3.id },
    );

    const result = await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id, u3.id] } } });

    expect(result.count).toBe(3);

    const after = await cleanupRaw.user.findMany({
      where: { id: { in: [u1.id, u2.id, u3.id] } },
      select: { id: true, email: true, deletedAt: true },
    });

    expect(after).toHaveLength(3);

    for (const row of after) {
      expect(row.deletedAt).not.toBeNull();
      expect(row.email).toMatch(/_deleted_\d+$/);
    }

    const suffixes = after.map((row) => {
      const match = row.email.match(/_deleted_(\d+)$/);

      return match?.[1];
    });

    expect(new Set(suffixes).size).toBe(1);
  });

  it("User: deleteMany with no matching rows returns count: 0 without raw write", async () => {
    const result = await prisma.user.deleteMany({ where: { id: "nonexistent-id-xyz" } });

    expect(result.count).toBe(0);
  });

  it("Product: bulk soft-delete suffixes slug for matched rows only", async () => {
    const namespace = crypto.randomUUID().slice(0, 8);
    const p1 = await cleanupRaw.product.create({
      data: {
        slug: `softdel-a-${namespace}`,
        title: "A",
        description: "A",
      },
    });
    const p2 = await cleanupRaw.product.create({
      data: {
        slug: `softdel-b-${namespace}`,
        title: "B",
        description: "B",
      },
    });
    const pKept = await cleanupRaw.product.create({
      data: {
        slug: `softdel-keep-${namespace}`,
        title: "Keep",
        description: "Keep",
      },
    });

    cleanup.push(
      { table: "product", id: p1.id },
      { table: "product", id: p2.id },
      { table: "product", id: pKept.id },
    );

    const result = await prisma.product.deleteMany({ where: { id: { in: [p1.id, p2.id] } } });

    expect(result.count).toBe(2);

    const matched = await cleanupRaw.product.findMany({
      where: { id: { in: [p1.id, p2.id] } },
      select: { slug: true, deletedAt: true },
    });

    for (const row of matched) {
      expect(row.deletedAt).not.toBeNull();
      expect(row.slug).toMatch(/_deleted_\d+$/);
    }

    const kept = await cleanupRaw.product.findUnique({ where: { id: pKept.id } });

    expect(kept?.deletedAt).toBeNull();
    expect(kept?.slug).toBe(`softdel-keep-${namespace}`);
  });

  it("MarketingBlogPost: bulk soft-delete suffixes slug", async () => {
    const namespace = crypto.randomUUID().slice(0, 8);
    const post1 = await cleanupRaw.marketingBlogPost.create({
      data: {
        slug: `softdel-blog-a-${namespace}`,
        title: "A",
        content: "A",
        authorName: "A",
      },
    });
    const post2 = await cleanupRaw.marketingBlogPost.create({
      data: {
        slug: `softdel-blog-b-${namespace}`,
        title: "B",
        content: "B",
        authorName: "B",
      },
    });

    cleanup.push(
      { table: "marketingBlogPost", id: post1.id },
      { table: "marketingBlogPost", id: post2.id },
    );

    const result = await prisma.marketingBlogPost.deleteMany({
      where: { id: { in: [post1.id, post2.id] } },
    });

    expect(result.count).toBe(2);

    const after = await cleanupRaw.marketingBlogPost.findMany({
      where: { id: { in: [post1.id, post2.id] } },
      select: { slug: true, deletedAt: true },
    });

    for (const row of after) {
      expect(row.deletedAt).not.toBeNull();
      expect(row.slug).toMatch(/_deleted_\d+$/);
    }
  });
});
