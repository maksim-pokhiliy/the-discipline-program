import { describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cmsPagesAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-pages-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsPagesAdminApi — empty DB", () => {
  describe("getPages", () => {
    it("returns an array", async () => {
      const result = await cmsPagesAdminApi.getPages();

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when filtered to test prefix slugs", async () => {
      const result = await cmsPagesAdminApi.getPages();
      const filtered = result.filter((page) => page.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("every returned page has required fields", async () => {
      const result = await cmsPagesAdminApi.getPages();

      for (const page of result) {
        expect(page.id).toBeDefined();
        expect(typeof page.id).toBe("string");
        expect(page.slug).toBeDefined();
        expect(typeof page.title).toBe("string");
        expect(page.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("getPageBySlug", () => {
    it("throws NotFoundError for non-existent slug", async () => {
      await expect(cmsPagesAdminApi.getPageBySlug(`${TEST_PREFIX}-non-existent`)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
