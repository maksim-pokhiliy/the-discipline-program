import { afterAll, describe, expect, it } from "vitest";

import { ContactStatus } from "@repo/contracts/cms/contact";

import { cleanupRaw } from "../../../test/helpers";

import { cmsContactInboundApi } from "./inbound";

describe("cmsContactInboundApi", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds.reverse()) {
      await cleanupRaw.marketingContactSubmission.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("createSubmission", () => {
    it("creates a submission with all fields", async () => {
      const result = await cmsContactInboundApi.createSubmission({
        name: "Ivan Petrov",
        contact: "+7 999 123 4567",
        program: "Starter",
        message: "I want to join",
      });

      createdIds.push(result.id);

      expect(result.name).toBe("Ivan Petrov");
      expect(result.contact).toBe("+7 999 123 4567");
      expect(result.program).toBe("Starter");
      expect(result.message).toBe("I want to join");
    });

    it("defaults status to NEW", async () => {
      const result = await cmsContactInboundApi.createSubmission({
        name: "Test",
        contact: "tg: @test",
        message: "Hello",
      });

      createdIds.push(result.id);

      expect(result.status).toBe(ContactStatus.NEW);
    });

    it("creates a submission without optional program", async () => {
      const result = await cmsContactInboundApi.createSubmission({
        name: "No Program",
        contact: "email@test.com",
        message: "Just a question",
      });

      createdIds.push(result.id);

      expect(result.program).toBeNull();
      expect(result.name).toBe("No Program");
    });

    it("returns valid timestamps", async () => {
      const before = new Date();

      const result = await cmsContactInboundApi.createSubmission({
        name: "Timestamp Test",
        contact: "phone",
        message: "check dates",
      });

      createdIds.push(result.id);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
