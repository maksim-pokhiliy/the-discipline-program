import { describe, expect, it } from "vitest";

import { createWeekInputSchema, updateWeekInputSchema } from "./week-api.schema";

describe("createWeekInputSchema.index — input boundaries (MT-1)", () => {
  it("accepts index = 0 (first slot)", () => {
    const result = createWeekInputSchema.safeParse({ index: 0 });

    expect(result.success).toBe(true);
  });

  it("accepts a typical positive index", () => {
    const result = createWeekInputSchema.safeParse({ index: 5 });

    expect(result.success).toBe(true);
  });

  it("rejects a negative index (nonnegative)", () => {
    const result = createWeekInputSchema.safeParse({ index: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects a fractional index (must be integer)", () => {
    const result = createWeekInputSchema.safeParse({ index: 1.5 });

    expect(result.success).toBe(false);
  });

  it("accepts index = 1000 — current accepted boundary (no .max(1000) cap; QA-001 tracks)", () => {
    const result = createWeekInputSchema.safeParse({ index: 1000 });

    expect(result.success).toBe(true);
  });

  it("accepts index = 2_147_483_647 — Int32 max accepted by Zod (QA-001/QA-009 tracks DB overflow risk)", () => {
    const result = createWeekInputSchema.safeParse({ index: 2_147_483_647 });

    expect(result.success).toBe(true);
  });

  it("accepts index = 2_147_483_648 — Zod has no upper bound today; documents QA-001 boundary gap", () => {
    const result = createWeekInputSchema.safeParse({ index: 2_147_483_648 });

    expect(result.success).toBe(true);
  });
});

describe("createWeekInputSchema — optional fields", () => {
  it("accepts payload with index only (label/notes omitted)", () => {
    const result = createWeekInputSchema.safeParse({ index: 0 });

    expect(result.success).toBe(true);
  });

  it("accepts label and notes when provided", () => {
    const result = createWeekInputSchema.safeParse({
      index: 0,
      label: "Hypertrophy",
      notes: "Volume bias",
    });

    expect(result.success).toBe(true);
  });

  it("rejects label longer than the configured max", () => {
    const result = createWeekInputSchema.safeParse({
      index: 0,
      label: "x".repeat(1024),
    });

    expect(result.success).toBe(false);
  });
});

describe("updateWeekInputSchema.index — input boundaries (MT-2)", () => {
  it("accepts payload without index (all fields optional)", () => {
    const result = updateWeekInputSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts index = 0 when present", () => {
    const result = updateWeekInputSchema.safeParse({ index: 0 });

    expect(result.success).toBe(true);
  });

  it("rejects a negative index", () => {
    const result = updateWeekInputSchema.safeParse({ index: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects a fractional index", () => {
    const result = updateWeekInputSchema.safeParse({ index: 0.5 });

    expect(result.success).toBe(false);
  });

  it("accepts label = null (explicit clear)", () => {
    const result = updateWeekInputSchema.safeParse({ label: null });

    expect(result.success).toBe(true);
  });
});
