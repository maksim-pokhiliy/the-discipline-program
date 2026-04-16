import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getContactsPageDataResponseSchema,
  getContactSubmissionsResponseSchema,
} from "@repo/contracts/cms/contact";

import { cleanupRaw } from "../../../test/helpers";

import { cmsContactAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-contact-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsContactAdminApi — empty DB", () => {
  beforeAll(async () => {
    await cleanupRaw.marketingContactSubmission.deleteMany({
      where: { message: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await cleanupRaw.marketingContactSubmission.deleteMany({
      where: { message: { startsWith: TEST_PREFIX } },
    });
  });

  describe("getContacts", () => {
    it("returns empty array filtered to test prefix when no matching submissions exist", async () => {
      const result = await cmsContactAdminApi.getContacts();
      const filtered = result.filter((contact) => contact.message.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("filtered (empty) subset validates against contact submissions response schema", async () => {
      const result = await cmsContactAdminApi.getContacts();
      const filtered = result.filter((contact) => contact.message.startsWith(TEST_PREFIX));
      const parsed = getContactSubmissionsResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });

  describe("getContactsPageData", () => {
    it("returns page data with empty contacts list filtered to test prefix", async () => {
      const result = await cmsContactAdminApi.getContactsPageData();
      const filtered = result.contacts.filter((contact) => contact.message.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("page data always has a contacts array", async () => {
      const result = await cmsContactAdminApi.getContactsPageData();

      expect(Array.isArray(result.contacts)).toBe(true);
    });

    it("page data with filtered (empty) contacts validates against response schema", async () => {
      const result = await cmsContactAdminApi.getContactsPageData();
      const filtered = {
        contacts: result.contacts.filter((contact) => contact.message.startsWith(TEST_PREFIX)),
      };
      const parsed = getContactsPageDataResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });
});
