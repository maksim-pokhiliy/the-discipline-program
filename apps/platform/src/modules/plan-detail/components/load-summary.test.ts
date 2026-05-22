import { describe, expect, it } from "vitest";

import { type Load, loadSchema } from "@repo/contracts/lms/_shared";

import { formatLoad } from "./load-summary";

const LOAD_FIXTURES: { name: string; load: Load }[] = [
  {
    name: "absolute single",
    load: { kind: "absolute", weight: { variant: "single", valueKg: 15 } },
  },
  { name: "absolute dual", load: { kind: "absolute", weight: { variant: "dual", valueKg: 15 } } },
  {
    name: "absolute single_arm",
    load: { kind: "absolute", weight: { variant: "single_arm", valueKg: 15 } },
  },
  {
    name: "absolute compound_device",
    load: {
      kind: "absolute",
      weight: { variant: "compound_device", equipment: "DUMBBELL", count: 2, valueKg: 15 },
    },
  },
  {
    name: "absolute split_tier",
    load: {
      kind: "absolute",
      weight: {
        variant: "split_tier",
        stages: [
          { reps: 5, equipment: "KETTLEBELL", valueKg: 24 },
          { reps: 10, equipment: "DUMBBELL", valueKg: 15 },
        ],
      },
    },
  },
  {
    name: "absolute dual_value",
    load: {
      kind: "absolute",
      weight: { variant: "dual_value", first: 50, second: 30, resolver: "athlete_profile" },
    },
  },
  {
    name: "absolute with_asymmetric_arm",
    load: {
      kind: "absolute",
      weight: {
        variant: "with_asymmetric_arm",
        valueKg: 15,
        workingArm: "left",
        passiveArmAction: "hold_in_up",
      },
    },
  },
  {
    name: "absolute with_depth_modifier",
    load: {
      kind: "absolute",
      weight: { variant: "with_depth_modifier", valueKg: 24, depth: "to_parallel" },
    },
  },
  {
    name: "percentage self",
    load: { kind: "percentage", value: 60, reference: { scope: "self" } },
  },
  {
    name: "percentage range + other_exercise",
    load: {
      kind: "percentage",
      value: 60,
      rangeMax: 70,
      reference: { scope: "other_exercise", targetExerciseId: "ckxw5p7gp0000q1mnzv5cuq0a" },
    },
  },
  { name: "bodyweight", load: { kind: "bodyweight" } },
  { name: "without_weight", load: { kind: "without_weight", context: "drop_set_stage" } },
  { name: "unspecified", load: { kind: "unspecified" } },
];

describe("formatLoad", () => {
  it.each(LOAD_FIXTURES)(
    "renders a non-empty string for the $name fixture without throwing (QA-#7, T24)",
    ({ load }) => {
      expect(loadSchema.safeParse(load).success).toBe(true);
      expect(formatLoad(load).length).toBeGreaterThan(0);
    },
  );

  describe("absolute weight variants (QA-#8, T24)", () => {
    it("renders single arm phrasing for single_arm", () => {
      const out = formatLoad({ kind: "absolute", weight: { variant: "single_arm", valueKg: 15 } });

      expect(out).toContain("single arm");
    });

    it("renders the count separator for compound_device", () => {
      const out = formatLoad({
        kind: "absolute",
        weight: { variant: "compound_device", equipment: "DUMBBELL", count: 2, valueKg: 15 },
      });

      expect(out).toContain("×");
    });

    it("renders the split prefix for split_tier", () => {
      const out = formatLoad({
        kind: "absolute",
        weight: {
          variant: "split_tier",
          stages: [
            { reps: 5, equipment: "KETTLEBELL", valueKg: 24 },
            { reps: 10, equipment: "DUMBBELL", valueKg: 15 },
          ],
        },
      });

      expect(out).toContain("split");
    });

    it("renders the slash separator for dual_value", () => {
      const out = formatLoad({
        kind: "absolute",
        weight: { variant: "dual_value", first: 50, second: 30, resolver: "athlete_profile" },
      });

      expect(out).toContain("/");
    });

    it("appends the extra-weight suffix for with_asymmetric_arm when passiveExtraWeight is set", () => {
      const out = formatLoad({
        kind: "absolute",
        weight: {
          variant: "with_asymmetric_arm",
          valueKg: 15,
          workingArm: "left",
          passiveArmAction: "hold_in_up",
          passiveExtraWeight: { equipment: "DUMBBELL", valueKg: 10 },
        },
      });

      expect(out).toContain("(+10 kg)");
    });

    it("renders the depth phrasing for with_depth_modifier", () => {
      const out = formatLoad({
        kind: "absolute",
        weight: { variant: "with_depth_modifier", valueKg: 24, depth: "to_parallel" },
      });

      expect(out).toContain("to parallel");
    });
  });

  describe("percentage reference scopes (QA-#9, T24)", () => {
    it("renders the self reference suffix", () => {
      const out = formatLoad({ kind: "percentage", value: 60, reference: { scope: "self" } });

      expect(out).toContain("self");
    });

    it("renders the movement_family name in the suffix", () => {
      const out = formatLoad({
        kind: "percentage",
        value: 60,
        reference: { scope: "movement_family", movementFamily: "squat pattern" },
      });

      expect(out).toContain("squat pattern");
    });

    it("renders a non-empty string for the editor-unauthorable other_exercise scope", () => {
      const out = formatLoad({
        kind: "percentage",
        value: 60,
        reference: { scope: "other_exercise", targetExerciseId: "ckxw5p7gp0000q1mnzv5cuq0a" },
      });

      expect(out.length).toBeGreaterThan(0);
    });

    it("renders a percentage range when rangeMax is set", () => {
      const out = formatLoad({
        kind: "percentage",
        value: 60,
        rangeMax: 70,
        reference: { scope: "self" },
      });

      expect(out).toContain("60-70%");
    });
  });
});
