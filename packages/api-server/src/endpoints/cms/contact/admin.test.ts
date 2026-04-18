import { afterAll, describe, expect, it } from "vitest";

import { ContactStatus } from "@repo/contracts/cms/contact";
import { NotFoundError } from "@repo/errors";

import { cleanup, createTestContactSubmission } from "../../../test/helpers";

import { cmsContactAdminApi } from "./admin";

describe("cmsContactAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getContacts", () => {
    it("returns all submissions ordered by createdAt desc", async () => {
      const first = await createTestContactSubmission();
      const second = await createTestContactSubmission();

      toCleanup.push(
        { table: "marketingContactSubmission", id: first.id },
        { table: "marketingContactSubmission", id: second.id },
      );

      const contacts = await cmsContactAdminApi.getContacts();

      const ids = contacts.map((c) => c.id);
      const firstIdx = ids.indexOf(first.id);
      const secondIdx = ids.indexOf(second.id);

      expect(firstIdx).toBeGreaterThan(-1);
      expect(secondIdx).toBeGreaterThan(-1);
      expect(secondIdx).toBeLessThan(firstIdx);
    });
  });

  describe("getContactById", () => {
    it("returns a single submission by id", async () => {
      const submission = await createTestContactSubmission({ message: "unique msg" });

      toCleanup.push({ table: "marketingContactSubmission", id: submission.id });

      const found = await cmsContactAdminApi.getContactById(submission.id);

      expect(found.id).toBe(submission.id);
      expect(found.message).toBe("unique msg");
      expect(found.status).toBe(ContactStatus.NEW);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(
        cmsContactAdminApi.getContactById("clxxxxxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateContact", () => {
    it("updates status", async () => {
      const submission = await createTestContactSubmission();

      toCleanup.push({ table: "marketingContactSubmission", id: submission.id });

      const updated = await cmsContactAdminApi.updateContact(submission.id, {
        status: ContactStatus.IN_PROGRESS,
      });

      expect(updated.status).toBe(ContactStatus.IN_PROGRESS);
    });

    it("updates notes and trims whitespace", async () => {
      const submission = await createTestContactSubmission();

      toCleanup.push({ table: "marketingContactSubmission", id: submission.id });

      const updated = await cmsContactAdminApi.updateContact(submission.id, {
        notes: "  some notes  ",
      });

      expect(updated.notes).toBe("some notes");
    });

    it("sets notes to null when empty string", async () => {
      const submission = await createTestContactSubmission();

      toCleanup.push({ table: "marketingContactSubmission", id: submission.id });

      await cmsContactAdminApi.updateContact(submission.id, { notes: "filled" });

      const cleared = await cmsContactAdminApi.updateContact(submission.id, { notes: "" });

      expect(cleared.notes).toBeNull();
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(
        cmsContactAdminApi.updateContact("clxxxxxxxxxxxxxxxxxxxxxxxxx", {
          status: ContactStatus.CLOSED,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteContact", () => {
    it("deletes a submission", async () => {
      const submission = await createTestContactSubmission();

      await cmsContactAdminApi.deleteContact(submission.id);

      await expect(cmsContactAdminApi.getContactById(submission.id)).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(cmsContactAdminApi.deleteContact("clxxxxxxxxxxxxxxxxxxxxxxxxx")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getContactsPageData", () => {
    it("returns contacts array wrapped in page data", async () => {
      const submission = await createTestContactSubmission();

      toCleanup.push({ table: "marketingContactSubmission", id: submission.id });

      const pageData = await cmsContactAdminApi.getContactsPageData();

      expect(pageData).toHaveProperty("contacts");
      expect(Array.isArray(pageData.contacts)).toBe(true);

      const ids = pageData.contacts.map((c) => c.id);

      expect(ids).toContain(submission.id);
    });
  });
});
