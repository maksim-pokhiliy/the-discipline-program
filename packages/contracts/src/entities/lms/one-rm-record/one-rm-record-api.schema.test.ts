import { describe, expect, it } from "vitest";

import { createOneRMRecordRequestSchema } from "./one-rm-record-api.schema";

describe("createOneRMRecordRequestSchema", () => {
  it("coerces string recordedAt to Date (HTTP JSON shape)", () => {
    const result = createOneRMRecordRequestSchema.safeParse({
      exerciseId: "ckxabcdefghijklmnopqrst",
      valueKg: 102.5,
      recordedAt: "2026-01-01",
      source: "MANUAL",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.recordedAt).toBeInstanceOf(Date);
    }
  });

  it("accepts Date instance directly (service-layer shape)", () => {
    const result = createOneRMRecordRequestSchema.safeParse({
      exerciseId: "ckxabcdefghijklmnopqrst",
      valueKg: 102.5,
      recordedAt: new Date("2026-01-01"),
      source: "MANUAL",
    });

    expect(result.success).toBe(true);
  });

  it("rejects bogus date string", () => {
    const result = createOneRMRecordRequestSchema.safeParse({
      exerciseId: "ckxabcdefghijklmnopqrst",
      valueKg: 102.5,
      recordedAt: "not-a-date",
      source: "MANUAL",
    });

    expect(result.success).toBe(false);
  });
});
