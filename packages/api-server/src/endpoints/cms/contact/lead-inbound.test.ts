import { afterAll, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestUser } from "../../../test/helpers";

import { cmsLeadInboundApi } from "./lead-inbound";
import * as sendModule from "./send-lead-notification-email";

describe("cmsLeadInboundApi.createLead", () => {
  const sendSpy = vi
    .spyOn(sendModule, "sendLeadNotificationEmail")
    .mockImplementation(async () => undefined);

  const createdIds: string[] = [];

  afterAll(async () => {
    sendSpy.mockRestore();

    for (const id of createdIds.reverse()) {
      await cleanupRaw.marketingContactSubmission.delete({ where: { id } }).catch(() => {});
    }
  });

  it("persists program and defaults message to empty string when message is omitted", async () => {
    const item = await cmsLeadInboundApi.createLead({
      contact: "tg:@x",
      program: "strength-base",
    });

    createdIds.push(item.id);

    expect(item.program).toBe("strength-base");

    const row = await cleanupRaw.marketingContactSubmission.findUnique({ where: { id: item.id } });

    expect(row?.message).toBe("");
  });

  it("persists the optional name when present", async () => {
    const item = await cmsLeadInboundApi.createLead({
      name: "Sam",
      contact: "x",
      program: "p",
      message: "hi",
    });

    createdIds.push(item.id);

    const row = await cleanupRaw.marketingContactSubmission.findUnique({ where: { id: item.id } });

    expect(row?.name).toBe("Sam");
    expect(row?.message).toBe("hi");
  });

  it("invokes the head-coach notify with the lead context", async () => {
    sendSpy.mockClear();

    const headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    try {
      const item = await cmsLeadInboundApi.createLead({
        contact: "tg:@notify",
        program: "strength-base",
      });

      createdIds.push(item.id);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ program: "strength-base", contact: expect.any(String) }),
      );
    } finally {
      await cleanupRaw.user.delete({ where: { id: headCoach.id } }).catch(() => {});
    }
  });

  it("still persists and resolves when the notify throws (best-effort)", async () => {
    sendSpy.mockImplementationOnce(async () => {
      throw new Error("boom");
    });

    const item = await cmsLeadInboundApi.createLead({
      contact: "tg:@besteffort",
      program: "p",
    });

    createdIds.push(item.id);

    expect(item.program).toBe("p");

    const row = await cleanupRaw.marketingContactSubmission.findUnique({ where: { id: item.id } });

    expect(row).not.toBeNull();
  });

  it("resolves the submission regardless of head-coach presence", async () => {
    const item = await cmsLeadInboundApi.createLead({ contact: "tg:@nocoach", program: "p" });

    createdIds.push(item.id);

    expect(item).toMatchObject({ program: "p" });
  });
});
