import { describe, expect, it } from "vitest";

import { REST_QUALIFIERS, REST_SCOPES, restSpecSchema, slotSpecSchema } from "./cap-spec";

describe("restSpecSchema", () => {
  it("accepts fixed duration with unit sec and no rangeMax", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 60, unit: "sec" },
        scope: "between_sets",
      }).success,
    ).toBe(true);
  });

  it("accepts range_sec duration with rangeMax > value", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "range_sec", rangeMax: 60 },
        scope: "between_sets",
      }).success,
    ).toBe(true);
  });

  it("accepts range_min duration with rangeMax > value", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 1, unit: "range_min", rangeMax: 3 },
        scope: "between_rounds",
      }).success,
    ).toBe(true);
  });

  it("rejects range_sec without rangeMax", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "range_sec" },
        scope: "between_sets",
      }).success,
    ).toBe(false);
  });

  it("rejects fixed sec WITH rangeMax", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "sec", rangeMax: 60 },
        scope: "between_sets",
      }).success,
    ).toBe(false);
  });

  it("rejects range_sec where rangeMax <= value", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "range_sec", rangeMax: 30 },
        scope: "between_sets",
      }).success,
    ).toBe(false);
  });

  it("accepts all 4 REST_SCOPES", () => {
    for (const scope of REST_SCOPES) {
      expect(
        restSpecSchema.safeParse({ duration: { value: 30, unit: "sec" }, scope }).success,
      ).toBe(true);
    }
  });

  it("accepts all 3 REST_QUALIFIERS", () => {
    for (const qualifier of REST_QUALIFIERS) {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 30, unit: "sec" },
          scope: "between_sets",
          qualifier,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts undefined qualifier", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "sec" },
        scope: "between_sets",
      }).success,
    ).toBe(true);
  });

  it("accepts optional setIndex as positive int", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "sec" },
        scope: "after_specific_set",
        setIndex: 3,
      }).success,
    ).toBe(true);
  });

  it("rejects setIndex zero", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "sec" },
        scope: "after_specific_set",
        setIndex: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects unknown scope", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 30, unit: "sec" },
        scope: "between_warmups",
      }).success,
    ).toBe(false);
  });

  it("rejects duration value zero", () => {
    expect(
      restSpecSchema.safeParse({
        duration: { value: 0, unit: "sec" },
        scope: "between_sets",
      }).success,
    ).toBe(false);
  });
});

describe("slotSpecSchema", () => {
  it("accepts single with positive int minute", () => {
    expect(slotSpecSchema.safeParse({ kind: "single", minute: 1 }).success).toBe(true);
  });

  it("accepts grouped with minutes length 2", () => {
    expect(slotSpecSchema.safeParse({ kind: "grouped", minutes: [1, 2] }).success).toBe(true);
  });

  it("rejects grouped with single-element minutes", () => {
    expect(slotSpecSchema.safeParse({ kind: "grouped", minutes: [1] }).success).toBe(false);
  });

  it("rejects grouped with empty minutes", () => {
    expect(slotSpecSchema.safeParse({ kind: "grouped", minutes: [] }).success).toBe(false);
  });

  it("rejects single with zero minute", () => {
    expect(slotSpecSchema.safeParse({ kind: "single", minute: 0 }).success).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(slotSpecSchema.safeParse({ kind: "scattered", minutes: [1, 2] }).success).toBe(false);
  });
});
