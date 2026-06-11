import { describe, expect, it } from "vitest";

import {
  LOAD_KINDS,
  type LoadKind,
  loadSchema,
  WEIGHT_VARIANTS,
  type WeightVariant,
  weightSchema,
} from "@repo/contracts/lms/_shared";

import { buildDefaultLoad, buildDefaultWeight } from "./weight-load-defaults";

describe("buildDefaultWeight", () => {
  it.each(WEIGHT_VARIANTS)(
    "returns a weightSchema-valid value with variant %s (QA-#1, T24)",
    (variant: WeightVariant) => {
      const result = buildDefaultWeight(variant);

      expect(result.variant).toBe(variant);
      expect(weightSchema.safeParse(result).success).toBe(true);
    },
  );

  it("returns exactly 2 stages for split_tier, each contract-valid (QA-#4, T24)", () => {
    const result = buildDefaultWeight("split_tier");

    expect(result.variant).toBe("split_tier");

    if (result.variant !== "split_tier") {
      throw new Error("expected split_tier variant");
    }

    expect(result.stages).toHaveLength(2);
    expect(weightSchema.safeParse(result).success).toBe(true);
  });

  it("has NO passiveExtraWeight key for with_asymmetric_arm (QA-#5, T24)", () => {
    const result = buildDefaultWeight("with_asymmetric_arm");

    expect("passiveExtraWeight" in result).toBe(false);
  });

  it("pins compound_device count to 2 and emits no resolver (QA-#6, T24)", () => {
    const result = buildDefaultWeight("compound_device");

    expect(result.variant).toBe("compound_device");

    if (result.variant !== "compound_device") {
      throw new Error("expected compound_device variant");
    }

    expect([1, 2]).toContain(result.count);
    expect("resolver" in result).toBe(false);
  });
});

describe("buildDefaultLoad", () => {
  it.each(LOAD_KINDS)(
    "returns a loadSchema-valid value with kind %s (QA-#2, T24)",
    (kind: LoadKind) => {
      const result = buildDefaultLoad(kind);

      expect(result.kind).toBe(kind);
      expect(loadSchema.safeParse(result).success).toBe(true);
    },
  );

  it("nests a contract-valid single weight for absolute (QA-#3, T24)", () => {
    const result = buildDefaultLoad("absolute");

    expect(result.kind).toBe("absolute");

    if (result.kind !== "absolute") {
      throw new Error("expected absolute kind");
    }

    expect(result.weight.variant).toBe("single");
    expect(weightSchema.safeParse(result.weight).success).toBe(true);
  });

  it("returns positive first/second kg for byProfile (QA-#2, T24)", () => {
    const result = buildDefaultLoad("byProfile");

    expect(result.kind).toBe("byProfile");

    if (result.kind !== "byProfile") {
      throw new Error("expected byProfile kind");
    }

    expect(result.first).toBeGreaterThan(0);
    expect(result.second).toBeGreaterThan(0);
  });

  it("sets percentage reference scope to self (QA-#2, T24)", () => {
    const result = buildDefaultLoad("percentage");

    expect(result.kind).toBe("percentage");

    if (result.kind !== "percentage") {
      throw new Error("expected percentage kind");
    }

    expect(result.reference.scope).toBe("self");
  });
});
