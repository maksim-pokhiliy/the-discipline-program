import { describe, expect, it } from "vitest";

import { dayOfWeekValues } from "../_shared";

import { DAY_CONSTANTS } from "./day.constants";
import {
  daySlotSchema,
  sessionWithLabelSchema,
  updateDayLabelSchema,
  updateDayNotesSchema,
} from "./day.schema";

const validCuid = "clp9z8x7w0000abcd1234efgh";

const baseLabel = {
  id: validCuid,
  name: "Push Day",
  nameLower: "push day",
  applicableLevels: ["DAY"] as const,
  notes: null,
  rest: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseSessionWithLabel = {
  id: "clp9z8x7w0000abcd1234abcd",
  dayId: "clp9z8x7w0000abcd1234efgh",
  order: 10,
  labelId: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  label: null,
  blocks: [],
};

const baseBlock = {
  id: "clp9z8x7w0000abcd1234dddd",
  sessionId: "clp9z8x7w0000abcd1234abcd",
  order: 10,
  intensity: { rpe: { value: 7 } },
  timeCap: { min: 10, max: 15, unit: "min" as const },
  notes: "block focus",
  labels: [baseLabel],
  schemas: [],
  groups: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("daySlotSchema", () => {
  it.each(dayOfWeekValues)("round-trips a minimal empty slot for %s", (dow) => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: dow,
      label: null,
      notes: null,
      sessions: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a minimal materialized slot", () => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: "MONDAY",
      label: null,
      notes: null,
      sessions: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty slot — same shape as unmaterialized representation", () => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: "TUESDAY",
      label: null,
      notes: null,
      sessions: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a fully materialized slot with embedded label and 2 sessions (one labelled, one not)", () => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: "WEDNESDAY",
      label: baseLabel,
      notes: "rest before push",
      sessions: [
        { ...baseSessionWithLabel, order: 10, label: null },
        { ...baseSessionWithLabel, id: "clp9z8x7w0000abcd1234abce", order: 20, label: baseLabel },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.label?.id).toBe(baseLabel.id);
      expect(result.data.sessions).toHaveLength(2);
      expect(result.data.sessions[0]?.label).toBeNull();
      expect(result.data.sessions[1]?.label?.id).toBe(baseLabel.id);
    }
  });

  it("rejects an invalid dayOfWeek", () => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: "FOOBAR",
      label: null,
      notes: null,
      sessions: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing sessions field", () => {
    const result = daySlotSchema.safeParse({
      dayOfWeek: "MONDAY",
      label: null,
      notes: null,
    });

    expect(result.success).toBe(false);
  });

  it("does not expose Day.id (D7 regression guard — Day is addressed via dayOfWeek)", () => {
    expect(daySlotSchema.shape).not.toHaveProperty("id");
  });
});

describe("sessionWithLabelSchema", () => {
  it("adds label to the base session shape", () => {
    expect(sessionWithLabelSchema.shape).toHaveProperty("label");
  });

  it("preserves base session fields", () => {
    expect(sessionWithLabelSchema.shape).toHaveProperty("id");
    expect(sessionWithLabelSchema.shape).toHaveProperty("dayId");
    expect(sessionWithLabelSchema.shape).toHaveProperty("order");
    expect(sessionWithLabelSchema.shape).toHaveProperty("labelId");
    expect(sessionWithLabelSchema.shape).toHaveProperty("notes");
  });

  it("does not expose name (Session.name carry-forward regression guard)", () => {
    expect(sessionWithLabelSchema.shape).not.toHaveProperty("name");
  });

  it("accepts blocks: [] (empty array — session without blocks)", () => {
    const result = sessionWithLabelSchema.safeParse(baseSessionWithLabel);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.blocks).toEqual([]);
    }
  });

  it("accepts a populated blocks array with embedded labels", () => {
    const result = sessionWithLabelSchema.safeParse({
      ...baseSessionWithLabel,
      blocks: [baseBlock],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.blocks).toHaveLength(1);
      expect(result.data.blocks[0]?.id).toBe(baseBlock.id);
      expect(result.data.blocks[0]?.labels).toHaveLength(1);
      expect(result.data.blocks[0]?.labels[0]?.id).toBe(baseLabel.id);
    }
  });
});

describe("updateDayLabelSchema", () => {
  it("accepts { labelId: null } (explicit clear)", () => {
    const result = updateDayLabelSchema.safeParse({ labelId: null });

    expect(result.success).toBe(true);
  });

  it("accepts a valid cuid labelId", () => {
    const result = updateDayLabelSchema.safeParse({ labelId: validCuid });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid labelId", () => {
    const result = updateDayLabelSchema.safeParse({ labelId: "not-a-cuid" });

    expect(result.success).toBe(false);
  });
});

describe("updateDayNotesSchema", () => {
  it("accepts a string under MAX_NOTES_LENGTH", () => {
    const result = updateDayNotesSchema.safeParse({ notes: "deload day" });

    expect(result.success).toBe(true);
  });

  it("accepts null notes (explicit clear)", () => {
    const result = updateDayNotesSchema.safeParse({ notes: null });

    expect(result.success).toBe(true);
  });

  it("accepts notes at MAX_NOTES_LENGTH", () => {
    const result = updateDayNotesSchema.safeParse({
      notes: "x".repeat(DAY_CONSTANTS.MAX_NOTES_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes over MAX_NOTES_LENGTH", () => {
    const result = updateDayNotesSchema.safeParse({
      notes: "x".repeat(DAY_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
