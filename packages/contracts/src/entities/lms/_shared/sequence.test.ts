import { describe, expect, it } from "vitest";

import { sequenceIndicatorSchema } from "./sequence";

describe("sequenceIndicatorSchema", () => {
  it("accepts before_named with targetLabel", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "before_named", targetLabel: "A" }).success,
    ).toBe(true);
  });

  it("accepts after_named with targetLabel", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "after_named", targetLabel: "B" }).success,
    ).toBe(true);
  });

  it("accepts before_named_after_named_composite with both labels", () => {
    expect(
      sequenceIndicatorSchema.safeParse({
        kind: "before_named_after_named_composite",
        beforeLabel: "A",
        afterLabel: "C",
      }).success,
    ).toBe(true);
  });

  it("accepts only_once_before with targetLabel", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "only_once_before", targetLabel: "A" }).success,
    ).toBe(true);
  });

  it("accepts after_each_round with no extras", () => {
    expect(sequenceIndicatorSchema.safeParse({ kind: "after_each_round" }).success).toBe(true);
  });

  it("accepts after_each_typed_round with type", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "after_each_typed_round", type: "amrap" }).success,
    ).toBe(true);
  });

  it("rejects before_named with empty targetLabel", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "before_named", targetLabel: "" }).success,
    ).toBe(false);
  });

  it("rejects before_named_after_named_composite with empty beforeLabel", () => {
    expect(
      sequenceIndicatorSchema.safeParse({
        kind: "before_named_after_named_composite",
        beforeLabel: "",
        afterLabel: "C",
      }).success,
    ).toBe(false);
  });

  it("rejects after_each_typed_round with empty type", () => {
    expect(
      sequenceIndicatorSchema.safeParse({ kind: "after_each_typed_round", type: "" }).success,
    ).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(sequenceIndicatorSchema.safeParse({ kind: "around" }).success).toBe(false);
  });
});
