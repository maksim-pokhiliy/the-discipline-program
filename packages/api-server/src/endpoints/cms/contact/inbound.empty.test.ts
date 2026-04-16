import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ContactStatus } from "@repo/contracts/cms/contact";

import { cleanupRaw } from "../../../test/helpers";

import { cmsContactInboundApi } from "./inbound";

const TEST_PREFIX = `test-empty-contact-inbound-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsContactInboundApi.createSubmission — empty DB", () => {
  const createdIds: string[] = [];

  beforeAll(async () => {
    await cleanupRaw.marketingContactSubmission.deleteMany({
      where: { message: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    for (const id of createdIds.reverse()) {
      await cleanupRaw.marketingContactSubmission.delete({ where: { id } }).catch(() => {});
    }

    await cleanupRaw.marketingContactSubmission.deleteMany({
      where: { message: { startsWith: TEST_PREFIX } },
    });
  });

  it("creates the first submission successfully on an empty submissions table", async () => {
    const payload = {
      name: "Empty DB Test User",
      contact: "empty-db-test@example.com",
      program: "Test Program",
      message: `${TEST_PREFIX}: first submission should not crash on empty DB`,
    };

    const result = await cmsContactInboundApi.createSubmission(payload);

    createdIds.push(result.id);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.name).toBe(payload.name);
    expect(result.contact).toBe(payload.contact);
    expect(result.program).toBe(payload.program);
    expect(result.message).toBe(payload.message);
  });

  it("new submission defaults to status NEW", async () => {
    const result = await cmsContactInboundApi.createSubmission({
      name: "Status Test",
      contact: "status-test@example.com",
      message: `${TEST_PREFIX}: status default check`,
    });

    createdIds.push(result.id);

    expect(result.status).toBe(ContactStatus.NEW);
  });

  it("returns valid Date timestamps on created submission", async () => {
    const before = new Date();

    const result = await cmsContactInboundApi.createSubmission({
      name: "Timestamp Test",
      contact: "timestamp-test@example.com",
      message: `${TEST_PREFIX}: timestamp check`,
    });

    createdIds.push(result.id);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
