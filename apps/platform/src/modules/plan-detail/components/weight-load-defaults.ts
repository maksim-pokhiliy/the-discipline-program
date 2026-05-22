import type { Load, LoadKind, Weight, WeightVariant } from "@repo/contracts/lms/_shared";

export const DEFAULT_VALUE_KG = 15;
export const DEFAULT_PERCENTAGE = 60;

type SplitTierStage = Extract<Weight, { variant: "split_tier" }>["stages"][number];

const buildDefaultStage = (): SplitTierStage => ({
  reps: 5,
  equipment: "DUMBBELL",
  valueKg: DEFAULT_VALUE_KG,
});

export const buildDefaultWeight = (variant: WeightVariant): Weight => {
  switch (variant) {
    case "single":
      return { variant: "single", valueKg: DEFAULT_VALUE_KG };
    case "dual":
      return { variant: "dual", valueKg: DEFAULT_VALUE_KG };
    case "single_arm":
      return { variant: "single_arm", valueKg: DEFAULT_VALUE_KG };
    case "compound_device":
      return {
        variant: "compound_device",
        equipment: "DUMBBELL",
        count: 2,
        valueKg: DEFAULT_VALUE_KG,
      };
    case "split_tier":
      return { variant: "split_tier", stages: [buildDefaultStage(), buildDefaultStage()] };
    case "dual_value":
      return {
        variant: "dual_value",
        first: DEFAULT_VALUE_KG,
        second: DEFAULT_VALUE_KG,
        resolver: "athlete_profile",
      };
    case "with_asymmetric_arm":
      return {
        variant: "with_asymmetric_arm",
        valueKg: DEFAULT_VALUE_KG,
        workingArm: "left",
        passiveArmAction: "hold_in_up",
      };
    case "with_depth_modifier":
      return { variant: "with_depth_modifier", valueKg: DEFAULT_VALUE_KG, depth: "to_parallel" };
  }
};

export const buildDefaultLoad = (kind: LoadKind): Load => {
  switch (kind) {
    case "absolute":
      return { kind: "absolute", weight: buildDefaultWeight("single") };
    case "percentage":
      return { kind: "percentage", value: DEFAULT_PERCENTAGE, reference: { scope: "self" } };
    case "bodyweight":
      return { kind: "bodyweight" };
    case "without_weight":
      return { kind: "without_weight", context: "drop_set_stage" };
    case "unspecified":
      return { kind: "unspecified" };
  }
};
