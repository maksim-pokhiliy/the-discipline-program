import { describe, expect, it } from "vitest";

import { perLimbDistributionSchema } from "./side";

const CUID = "ck1234567890123456789012";

describe("perLimbDistributionSchema", () => {
  it("accepts each_leg with no extras", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "each_leg" }).success).toBe(true);
  });

  it("accepts each_leg with countPerLimb", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "each_leg", countPerLimb: 8 }).success).toBe(
      true,
    );
  });

  it("accepts each_arm with no extras", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "each_arm" }).success).toBe(true);
  });

  it("accepts each_arm with countPerLimb", () => {
    expect(
      perLimbDistributionSchema.safeParse({ kind: "each_arm", countPerLimb: 12 }).success,
    ).toBe(true);
  });

  it("accepts explicit_split with side left", () => {
    expect(
      perLimbDistributionSchema.safeParse({ kind: "explicit_split", side: "left" }).success,
    ).toBe(true);
  });

  it("accepts explicit_split with side right", () => {
    expect(
      perLimbDistributionSchema.safeParse({
        kind: "explicit_split",
        side: "right",
      }).success,
    ).toBe(true);
  });

  it("rejects explicit_split with side outside left/right", () => {
    expect(
      perLimbDistributionSchema.safeParse({ kind: "explicit_split", side: "middle" }).success,
    ).toBe(false);
  });

  it("strips the dropped pairedRowId field (sibling-ref killed, DR-W4-PAIRED)", () => {
    const result = perLimbDistributionSchema.safeParse({
      kind: "explicit_split",
      side: "left",
      pairedRowId: CUID,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ kind: "explicit_split", side: "left" });
    }
  });

  it("accepts alternating with no extras", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "alternating" }).success).toBe(true);
  });

  it("accepts alternating with sourceAnnotation", () => {
    expect(
      perLimbDistributionSchema.safeParse({
        kind: "alternating",
        sourceAnnotation: "starts on right",
      }).success,
    ).toBe(true);
  });

  it("rejects alternating with empty sourceAnnotation", () => {
    expect(
      perLimbDistributionSchema.safeParse({ kind: "alternating", sourceAnnotation: "" }).success,
    ).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "both" }).success).toBe(false);
  });

  it("rejects each_leg with zero countPerLimb", () => {
    expect(perLimbDistributionSchema.safeParse({ kind: "each_leg", countPerLimb: 0 }).success).toBe(
      false,
    );
  });
});
