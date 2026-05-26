import { describe, expect, it } from "vitest";

import type { Weight } from "@repo/contracts/lms/_shared";

import { formatWeight } from "./format-weight";

describe("formatWeight", () => {
  describe("single variant", () => {
    it("renders '<valueKg> kg' for a single weight", () => {
      const w: Weight = { variant: "single", valueKg: 15 };

      expect(formatWeight(w)).toBe("15 kg");
    });
  });

  describe("dual variant", () => {
    it("prefixes with '2 × ' for dual weight", () => {
      const w: Weight = { variant: "dual", valueKg: 15 };

      expect(formatWeight(w)).toBe("2 × 15 kg");
    });
  });

  describe("single_arm variant", () => {
    it("appends ' (single-arm)' to the kg amount", () => {
      const w: Weight = { variant: "single_arm", valueKg: 12 };

      expect(formatWeight(w)).toBe("12 kg (single-arm)");
    });
  });

  describe("compound_device variant", () => {
    it("renders lowercased equipment label when count is 1", () => {
      const w: Weight = {
        variant: "compound_device",
        equipment: "DUMBBELL",
        count: 1,
        valueKg: 20,
      };

      expect(formatWeight(w)).toBe("20 kg dumbbell");
    });

    it("prefixes with '2 × ' when count is 2", () => {
      const w: Weight = {
        variant: "compound_device",
        equipment: "KETTLEBELL",
        count: 2,
        valueKg: 16,
      };

      expect(formatWeight(w)).toBe("2 × 16 kg kettlebell");
    });

    it("lowercases multi-word equipment label", () => {
      const w: Weight = {
        variant: "compound_device",
        equipment: "PARALLEL_BARS",
        count: 1,
        valueKg: 0.5,
      };

      expect(formatWeight(w)).toBe("0.5 kg parallel bars");
    });
  });

  describe("split_tier variant", () => {
    it("joins stages with ' → ' using '<reps> @ <kg> kg' format", () => {
      const w: Weight = {
        variant: "split_tier",
        stages: [
          { reps: 5, equipment: "BARBELL", valueKg: 60 },
          { reps: 3, equipment: "BARBELL", valueKg: 70 },
          { reps: 1, equipment: "BARBELL", valueKg: 80 },
        ],
      };

      expect(formatWeight(w)).toBe("5 @ 60 kg → 3 @ 70 kg → 1 @ 80 kg");
    });
  });

  describe("dual_value variant", () => {
    it("renders '<first> / <second> kg (M/F)'", () => {
      const w: Weight = {
        variant: "dual_value",
        first: 24,
        second: 16,
        resolver: "athlete_profile",
      };

      expect(formatWeight(w)).toBe("24 / 16 kg (M/F)");
    });
  });

  describe("with_asymmetric_arm variant", () => {
    it("renders kg + working arm + passive action with underscores replaced", () => {
      const w: Weight = {
        variant: "with_asymmetric_arm",
        valueKg: 24,
        workingArm: "right",
        passiveArmAction: "hold_in_up",
      };

      expect(formatWeight(w)).toBe("24 kg · right arm working, passive: hold in up");
    });

    it("replaces multiple underscores in passive action", () => {
      const w: Weight = {
        variant: "with_asymmetric_arm",
        valueKg: 32,
        workingArm: "left",
        passiveArmAction: "hold_with_extra_weight",
      };

      expect(formatWeight(w)).toBe("32 kg · left arm working, passive: hold with extra weight");
    });
  });

  describe("with_depth_modifier variant", () => {
    it("appends depth with underscores replaced", () => {
      const w: Weight = {
        variant: "with_depth_modifier",
        valueKg: 100,
        depth: "to_parallel",
      };

      expect(formatWeight(w)).toBe("100 kg · to parallel");
    });

    it("renders 'full_rom' depth as 'full rom'", () => {
      const w: Weight = {
        variant: "with_depth_modifier",
        valueKg: 100,
        depth: "full_rom",
      };

      expect(formatWeight(w)).toBe("100 kg · full rom");
    });
  });
});
