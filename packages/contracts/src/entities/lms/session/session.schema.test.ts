import { describe, expect, it } from "vitest";

import { SESSION_CONSTANTS } from "./session.constants";
import {
  createSessionSchema,
  reorderSessionsSchema,
  sessionSchema,
  updateSessionSchema,
} from "./session.schema";

const baseSession = {
  id: "clz1234567890123456789012",
  dayId: "clz1234567890123456789aaa",
  order: 10,
  labelId: "clz1234567890123456789bbb",
  notes: "warmup focus",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseCreateInput = {
  labelId: "clz1234567890123456789bbb",
  notes: "warmup focus",
};

describe("sessionSchema", () => {
  it("accepts a fully-populated valid object", () => {
    const result = sessionSchema.safeParse(baseSession);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(baseSession.id);
      expect(result.data.dayId).toBe(baseSession.dayId);
      expect(result.data.order).toBe(10);
      expect(result.data.labelId).toBe(baseSession.labelId);
      expect(result.data.notes).toBe("warmup focus");
    }
  });

  it("accepts labelId: null and notes: null", () => {
    const result = sessionSchema.safeParse({
      ...baseSession,
      labelId: null,
      notes: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labelId).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects order: 0 and order: -1", () => {
    expect(sessionSchema.safeParse({ ...baseSession, order: 0 }).success).toBe(false);
    expect(sessionSchema.safeParse({ ...baseSession, order: -1 }).success).toBe(false);
  });

  it("rejects order: 1.5 (non-integer)", () => {
    const result = sessionSchema.safeParse({ ...baseSession, order: 1.5 });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid id", () => {
    const result = sessionSchema.safeParse({ ...baseSession, id: "not-a-cuid" });

    expect(result.success).toBe(false);
  });

  it("does not expose name (Session.name guardrail)", () => {
    expect(sessionSchema.shape).not.toHaveProperty("name");
  });
});

describe("createSessionSchema", () => {
  it("accepts an empty object (empty slot creation)", () => {
    const result = createSessionSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts { labelId } alone", () => {
    const result = createSessionSchema.safeParse({ labelId: baseCreateInput.labelId });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labelId).toBe(baseCreateInput.labelId);
    }
  });

  it("accepts { notes } alone", () => {
    const result = createSessionSchema.safeParse({ notes: "warmup focus" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.notes).toBe("warmup focus");
    }
  });

  it("accepts { labelId: null, notes: null } (explicit clear)", () => {
    const result = createSessionSchema.safeParse({ labelId: null, notes: null });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labelId).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  it("accepts notes at MAX_NOTES_LENGTH", () => {
    const result = createSessionSchema.safeParse({
      notes: "x".repeat(SESSION_CONSTANTS.MAX_NOTES_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes longer than MAX_NOTES_LENGTH", () => {
    const result = createSessionSchema.safeParse({
      notes: "x".repeat(SESSION_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid labelId", () => {
    const result = createSessionSchema.safeParse({ labelId: "not-a-cuid" });

    expect(result.success).toBe(false);
  });

  it("does not expose name (Session.name guardrail)", () => {
    expect(createSessionSchema.shape).not.toHaveProperty("name");
  });
});

describe("updateSessionSchema", () => {
  it("is an alias of createSessionSchema (identity)", () => {
    expect(updateSessionSchema).toBe(createSessionSchema);
  });

  it("accepts an empty object", () => {
    const result = updateSessionSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts { labelId } alone", () => {
    const result = updateSessionSchema.safeParse({ labelId: baseCreateInput.labelId });

    expect(result.success).toBe(true);
  });

  it("accepts { notes } alone", () => {
    const result = updateSessionSchema.safeParse({ notes: "updated note" });

    expect(result.success).toBe(true);
  });

  it("accepts { labelId: null, notes: null } (explicit clear)", () => {
    const result = updateSessionSchema.safeParse({ labelId: null, notes: null });

    expect(result.success).toBe(true);
  });

  it("accepts notes at MAX_NOTES_LENGTH", () => {
    const result = updateSessionSchema.safeParse({
      notes: "x".repeat(SESSION_CONSTANTS.MAX_NOTES_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes longer than MAX_NOTES_LENGTH", () => {
    const result = updateSessionSchema.safeParse({
      notes: "x".repeat(SESSION_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid labelId", () => {
    const result = updateSessionSchema.safeParse({ labelId: "not-a-cuid" });

    expect(result.success).toBe(false);
  });
});

describe("reorderSessionsSchema", () => {
  it("accepts an array of three cuids", () => {
    const result = reorderSessionsSchema.safeParse({
      orderedIds: [
        "clz1234567890123456789aaa",
        "clz1234567890123456789bbb",
        "clz1234567890123456789ccc",
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.orderedIds).toHaveLength(3);
    }
  });

  it("rejects an empty array (min(1))", () => {
    const result = reorderSessionsSchema.safeParse({ orderedIds: [] });

    expect(result.success).toBe(false);
  });

  it("rejects an array containing a non-cuid string", () => {
    const result = reorderSessionsSchema.safeParse({
      orderedIds: ["clz1234567890123456789aaa", "not-a-cuid"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate cuids", () => {
    const result = reorderSessionsSchema.safeParse({
      orderedIds: [
        "clz1234567890123456789aaa",
        "clz1234567890123456789bbb",
        "clz1234567890123456789aaa",
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("orderedIds must be unique");
    }
  });
});
