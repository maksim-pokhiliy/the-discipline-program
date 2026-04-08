import { afterAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw } from "../test/helpers";

import { prisma } from "./client";

describe("soft-delete extension", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("Product slug mangling on delete", () => {
    it("delete() mangles unique slug field", async () => {
      const originalSlug = `test-slug-${crypto.randomUUID().slice(0, 8)}`;
      const product = await cleanupRaw.product.create({
        data: {
          slug: originalSlug,
          title: "Test Product",
          description: "Test",
          isActive: false,
        },
      });

      toCleanup.push({ table: "product", id: product.id });

      await prisma.product.delete({ where: { id: product.id } });

      const raw = await cleanupRaw.product.findUnique({
        where: { id: product.id },
      });

      if (!raw) {
        throw new Error("expected raw record");
      }

      expect(raw.slug).toMatch(new RegExp(`^${originalSlug}_deleted_\\d+$`));
      expect(raw.deletedAt).toBeInstanceOf(Date);
    });
  });
});
