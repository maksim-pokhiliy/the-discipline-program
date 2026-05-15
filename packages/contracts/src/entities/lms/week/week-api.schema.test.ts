import { describe, expect, it } from "vitest";

import { WEEK_CONSTANTS } from "./week.constants";
import { updateWeekNotesSchema, weekSchema } from "./week.schema";

describe("weekSchema", () => {
  it("coerces string startDate to Date (HTTP JSON shape)", () => {
    const result = weekSchema.safeParse({
      id: "ckxabcdefghijklmnopqrst",
      planId: "ckxabcdefghijklmnopqrsu",
      startDate: "2026-05-18",
      notes: null,
      createdAt: new Date("2026-05-18"),
      updatedAt: new Date("2026-05-18"),
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it("accepts a Date instance for startDate directly (service-layer shape)", () => {
    const result = weekSchema.safeParse({
      id: "ckxabcdefghijklmnopqrst",
      planId: "ckxabcdefghijklmnopqrsu",
      startDate: new Date("2026-05-18"),
      notes: null,
      createdAt: new Date("2026-05-18"),
      updatedAt: new Date("2026-05-18"),
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });
});

describe("updateWeekNotesSchema", () => {
  it("accepts a string notes value", () => {
    const result = updateWeekNotesSchema.safeParse({ notes: "deload week" });

    expect(result.success).toBe(true);
  });

  it("accepts null notes (clears the field)", () => {
    const result = updateWeekNotesSchema.safeParse({ notes: null });

    expect(result.success).toBe(true);
  });

  it("rejects a notes string over MAX_NOTES_LENGTH", () => {
    const result = updateWeekNotesSchema.safeParse({
      notes: "x".repeat(WEEK_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
