import { describe, expect, it } from "vitest";

import {
  WEIGHT_COMPOUND_DEVICE_EQUIPMENT,
  WEIGHT_DEPTH_MODIFIERS,
  WEIGHT_PASSIVE_ARM_ACTIONS,
  WEIGHT_SPLIT_TIER_EQUIPMENT,
  weightSchema,
} from "./weight";

describe("weightSchema", () => {
  it("accepts single variant with positive valueKg", () => {
    expect(weightSchema.safeParse({ variant: "single", valueKg: 15 }).success).toBe(true);
  });

  it("rejects single variant with negative valueKg", () => {
    expect(weightSchema.safeParse({ variant: "single", valueKg: -5 }).success).toBe(false);
  });

  it("rejects single variant with zero valueKg", () => {
    expect(weightSchema.safeParse({ variant: "single", valueKg: 0 }).success).toBe(false);
  });

  it("accepts dual variant", () => {
    expect(weightSchema.safeParse({ variant: "dual", valueKg: 22.5 }).success).toBe(true);
  });

  it("accepts single_arm variant", () => {
    expect(weightSchema.safeParse({ variant: "single_arm", valueKg: 10 }).success).toBe(true);
  });

  it("accepts compound_device variant with count 1 and 2", () => {
    expect(
      weightSchema.safeParse({
        variant: "compound_device",
        equipment: "DUMBBELL",
        count: 2,
        valueKg: 15,
      }).success,
    ).toBe(true);
    expect(
      weightSchema.safeParse({
        variant: "compound_device",
        equipment: "BARBELL",
        count: 1,
        valueKg: 40,
      }).success,
    ).toBe(true);
  });

  it("rejects compound_device with count 3", () => {
    expect(
      weightSchema.safeParse({
        variant: "compound_device",
        equipment: "DUMBBELL",
        count: 3,
        valueKg: 15,
      }).success,
    ).toBe(false);
  });

  it("rejects compound_device with equipment outside narrow tuple", () => {
    expect(
      weightSchema.safeParse({
        variant: "compound_device",
        equipment: "ATLAS_STONE",
        count: 2,
        valueKg: 50,
      }).success,
    ).toBe(false);
  });

  it("accepts compound_device for all 12 allowed equipment values", () => {
    for (const equipment of WEIGHT_COMPOUND_DEVICE_EQUIPMENT) {
      expect(
        weightSchema.safeParse({ variant: "compound_device", equipment, count: 1, valueKg: 5 })
          .success,
      ).toBe(true);
    }
  });

  it("accepts split_tier with 2-stage minimum", () => {
    expect(
      weightSchema.safeParse({
        variant: "split_tier",
        stages: [
          { reps: 5, equipment: "DUMBBELL", valueKg: 20 },
          { reps: 3, equipment: "DUMBBELL", valueKg: 15 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects split_tier with 1 stage", () => {
    expect(
      weightSchema.safeParse({
        variant: "split_tier",
        stages: [{ reps: 5, equipment: "DUMBBELL", valueKg: 20 }],
      }).success,
    ).toBe(false);
  });

  it("rejects split_tier with empty stages array", () => {
    expect(weightSchema.safeParse({ variant: "split_tier", stages: [] }).success).toBe(false);
  });

  it("rejects split_tier with equipment outside narrow tuple (e.g., BODYWEIGHT)", () => {
    expect(
      weightSchema.safeParse({
        variant: "split_tier",
        stages: [
          { reps: 5, equipment: "BODYWEIGHT", valueKg: 0 },
          { reps: 3, equipment: "DUMBBELL", valueKg: 15 },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts split_tier for all 4 allowed equipment values", () => {
    for (const equipment of WEIGHT_SPLIT_TIER_EQUIPMENT) {
      expect(
        weightSchema.safeParse({
          variant: "split_tier",
          stages: [
            { reps: 5, equipment, valueKg: 20 },
            { reps: 3, equipment, valueKg: 15 },
          ],
        }).success,
      ).toBe(true);
    }
  });

  it("accepts dual_value variant", () => {
    expect(
      weightSchema.safeParse({
        variant: "dual_value",
        first: 50,
        second: 30,
        resolver: "athlete_profile",
      }).success,
    ).toBe(true);
  });

  it("rejects dual_value with resolver other than athlete_profile", () => {
    expect(
      weightSchema.safeParse({
        variant: "dual_value",
        first: 50,
        second: 30,
        resolver: "default",
      }).success,
    ).toBe(false);
  });

  it("accepts with_asymmetric_arm with workingArm left and right", () => {
    expect(
      weightSchema.safeParse({
        variant: "with_asymmetric_arm",
        valueKg: 20,
        workingArm: "left",
        passiveArmAction: "hold_in_up",
      }).success,
    ).toBe(true);
    expect(
      weightSchema.safeParse({
        variant: "with_asymmetric_arm",
        valueKg: 20,
        workingArm: "right",
        passiveArmAction: "hold_static",
      }).success,
    ).toBe(true);
  });

  it("accepts with_asymmetric_arm for all 3 passiveArmAction values", () => {
    for (const passiveArmAction of WEIGHT_PASSIVE_ARM_ACTIONS) {
      expect(
        weightSchema.safeParse({
          variant: "with_asymmetric_arm",
          valueKg: 20,
          workingArm: "left",
          passiveArmAction,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts with_asymmetric_arm with optional passiveExtraWeight", () => {
    expect(
      weightSchema.safeParse({
        variant: "with_asymmetric_arm",
        valueKg: 20,
        workingArm: "left",
        passiveArmAction: "hold_with_extra_weight",
        passiveExtraWeight: { equipment: "DUMBBELL", valueKg: 10 },
      }).success,
    ).toBe(true);
  });

  it("rejects with_asymmetric_arm passiveExtraWeight equipment outside narrow tuple", () => {
    expect(
      weightSchema.safeParse({
        variant: "with_asymmetric_arm",
        valueKg: 20,
        workingArm: "left",
        passiveArmAction: "hold_with_extra_weight",
        passiveExtraWeight: { equipment: "BARBELL", valueKg: 10 },
      }).success,
    ).toBe(false);
  });

  it("accepts with_depth_modifier for all 3 depth values", () => {
    for (const depth of WEIGHT_DEPTH_MODIFIERS) {
      expect(
        weightSchema.safeParse({ variant: "with_depth_modifier", valueKg: 100, depth }).success,
      ).toBe(true);
    }
  });

  it("rejects with_depth_modifier with unknown depth value", () => {
    expect(
      weightSchema.safeParse({
        variant: "with_depth_modifier",
        valueKg: 100,
        depth: "deep",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown variant (discriminator mismatch)", () => {
    expect(weightSchema.safeParse({ variant: "mystery", valueKg: 10 }).success).toBe(false);
  });

  it("rejects missing variant discriminator", () => {
    expect(weightSchema.safeParse({ valueKg: 10 }).success).toBe(false);
  });

  it("rejects split_tier stage missing reps", () => {
    expect(
      weightSchema.safeParse({
        variant: "split_tier",
        stages: [
          { equipment: "DUMBBELL", valueKg: 20 },
          { reps: 3, equipment: "DUMBBELL", valueKg: 15 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects split_tier stage with non-integer reps", () => {
    expect(
      weightSchema.safeParse({
        variant: "split_tier",
        stages: [
          { reps: 5.5, equipment: "DUMBBELL", valueKg: 20 },
          { reps: 3, equipment: "DUMBBELL", valueKg: 15 },
        ],
      }).success,
    ).toBe(false);
  });
});
