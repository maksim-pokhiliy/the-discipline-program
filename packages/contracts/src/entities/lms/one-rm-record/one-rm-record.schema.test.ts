import { describe, expect, it } from "vitest";

import { createOneRMRecordSchema, oneRMRecordSchema } from "./one-rm-record.schema";

const CUID = "ck1234567890123456789012";

const baseCreate = {
  exerciseId: CUID,
  valueKg: 150.5,
  recordedAt: "2026-01-01",
  source: "MANUAL",
};

const baseRecord = {
  id: CUID,
  userId: CUID,
  exerciseId: CUID,
  valueKg: 150.5,
  recordedAt: "2026-01-01",
  source: "MANUAL",
};

describe("createOneRMRecordSchema", () => {
  it("rejects valueKg over the column ceiling (M11 — was a Postgres overflow 500)", () => {
    expect(createOneRMRecordSchema.safeParse({ ...baseCreate, valueKg: 10000 }).success).toBe(
      false,
    );
  });

  it("rejects valueKg with more than two decimals", () => {
    expect(createOneRMRecordSchema.safeParse({ ...baseCreate, valueKg: 100.125 }).success).toBe(
      false,
    );
  });

  it.each([150.5, 200.25, 9999.99, 142.45])("accepts a realistic 1RM valueKg %p", (valueKg) => {
    expect(createOneRMRecordSchema.safeParse({ ...baseCreate, valueKg }).success).toBe(true);
  });
});

describe("oneRMRecordSchema", () => {
  it("rejects a read DTO whose valueKg is over the column ceiling", () => {
    expect(oneRMRecordSchema.safeParse({ ...baseRecord, valueKg: 10000 }).success).toBe(false);
  });

  it("accepts a read DTO with a float-trap 2-decimal valueKg", () => {
    expect(oneRMRecordSchema.safeParse({ ...baseRecord, valueKg: 142.45 }).success).toBe(true);
  });
});
