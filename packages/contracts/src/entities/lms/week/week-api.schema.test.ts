import { describe, expect, it } from "vitest";

import { dayOfWeekValues } from "../_shared";

import { getWeekResponseSchema } from "./week-api.schema";
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

describe("getWeekResponseSchema (Step 6.2 — 7-day shape)", () => {
  const emptySlots = dayOfWeekValues.map((dow) => ({
    dayOfWeek: dow,
    label: null,
    notes: null,
    sessions: [],
  }));

  const baseWeek = {
    id: "ckxabcdefghijklmnopqrst",
    planId: "ckxabcdefghijklmnopqrsu",
    startDate: "2026-05-18",
    notes: null,
    createdAt: new Date("2026-05-18"),
    updatedAt: new Date("2026-05-18"),
  };

  it("accepts { week: null, days: [7 empty slots, one per weekday] }", () => {
    const result = getWeekResponseSchema.safeParse({ week: null, days: emptySlots });

    expect(result.success).toBe(true);
  });

  it("accepts a materialized week with mixed empty/materialized days", () => {
    const result = getWeekResponseSchema.safeParse({
      week: baseWeek,
      days: emptySlots,
    });

    expect(result.success).toBe(true);
  });

  it("rejects days.length === 6", () => {
    const result = getWeekResponseSchema.safeParse({
      week: null,
      days: emptySlots.slice(0, 6),
    });

    expect(result.success).toBe(false);
  });

  it("rejects days.length === 8", () => {
    const result = getWeekResponseSchema.safeParse({
      week: null,
      days: [...emptySlots, emptySlots[0]],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing days field (legacy { week } shape — breaking change is enforced)", () => {
    const result = getWeekResponseSchema.safeParse({ week: null });

    expect(result.success).toBe(false);
  });
});
