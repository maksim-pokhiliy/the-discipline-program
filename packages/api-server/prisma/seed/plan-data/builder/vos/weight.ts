import type {
  Weight,
  WeightAsymmetricPassiveEquipment,
  WeightCompoundDeviceEquipment,
  WeightDepthModifier,
  WeightPassiveArmAction,
  WeightSplitTierEquipment,
  WeightWorkingArm,
} from "@repo/contracts/lms/_shared";

const SPLIT_TIER_MIN_STAGES = 2;

export const singleWeight = (valueKg: number): Weight => ({ variant: "single", valueKg });

export const dualWeight = (valueKg: number): Weight => ({ variant: "dual", valueKg });

export const singleArmWeight = (valueKg: number): Weight => ({ variant: "single_arm", valueKg });

export type CompoundDeviceWeightInput = {
  equipment: WeightCompoundDeviceEquipment;
  count: 1 | 2;
  valueKg: number;
};

export const compoundDeviceWeight = (input: CompoundDeviceWeightInput): Weight => ({
  variant: "compound_device",
  equipment: input.equipment,
  count: input.count,
  valueKg: input.valueKg,
});

export type SplitTierStageInput = {
  reps: number;
  equipment: WeightSplitTierEquipment;
  valueKg: number;
};

export const splitTierWeight = (stages: SplitTierStageInput[]): Weight => {
  if (stages.length < SPLIT_TIER_MIN_STAGES) {
    throw new Error(
      `splitTierWeight: requires at least ${SPLIT_TIER_MIN_STAGES} stages (got ${stages.length})`,
    );
  }

  return { variant: "split_tier", stages };
};

export type DualValueWeightInput = { first: number; second: number };

export const dualValueWeight = (input: DualValueWeightInput): Weight => ({
  variant: "dual_value",
  first: input.first,
  second: input.second,
  resolver: "athlete_profile",
});

export type AsymmetricArmWeightInput = {
  valueKg: number;
  workingArm: WeightWorkingArm;
  passiveArmAction: WeightPassiveArmAction;
  passiveExtraWeight?: { equipment: WeightAsymmetricPassiveEquipment; valueKg: number };
};

export const withAsymmetricArmWeight = (input: AsymmetricArmWeightInput): Weight =>
  input.passiveExtraWeight === undefined
    ? {
        variant: "with_asymmetric_arm",
        valueKg: input.valueKg,
        workingArm: input.workingArm,
        passiveArmAction: input.passiveArmAction,
      }
    : {
        variant: "with_asymmetric_arm",
        valueKg: input.valueKg,
        workingArm: input.workingArm,
        passiveArmAction: input.passiveArmAction,
        passiveExtraWeight: input.passiveExtraWeight,
      };

export type DepthModifierWeightInput = { valueKg: number; depth: WeightDepthModifier };

export const withDepthModifierWeight = (input: DepthModifierWeightInput): Weight => ({
  variant: "with_depth_modifier",
  valueKg: input.valueKg,
  depth: input.depth,
});
