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

describe("createOneRMRecordRequestSchema valueKg bound (M11 at the request boundary)", () => {
  const base = {
    exerciseId: "ckxabcdefghijklmnopqrst",
    recordedAt: "2026-01-01",
    source: "MANUAL",
  };

  it("rejects valueKg at the overflow boundary (10000)", () => {
    expect(createOneRMRecordRequestSchema.safeParse({ ...base, valueKg: 10000 }).success).toBe(
      false,
    );
  });

  it("rejects valueKg with more than two decimals (100.125)", () => {
    expect(createOneRMRecordRequestSchema.safeParse({ ...base, valueKg: 100.125 }).success).toBe(
      false,
    );
  });

  it.each([150.5, 9999.99])("accepts a realistic 1RM valueKg %p", (valueKg) => {
    expect(createOneRMRecordRequestSchema.safeParse({ ...base, valueKg }).success).toBe(true);
  });
});
