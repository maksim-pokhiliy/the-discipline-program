import type { Load, PercentageReference, Weight } from "@repo/contracts/lms/_shared";

export const absoluteLoad = (weight: Weight): Load => ({ kind: "absolute", weight });

export const percentageLoad = (
  value: number,
  reference: PercentageReference,
  rangeMax?: number,
): Load => {
  if (rangeMax !== undefined && rangeMax <= value) {
    throw new Error(
      `percentageLoad: rangeMax must be greater than value (value=${value}, rangeMax=${rangeMax})`,
    );
  }

  return rangeMax === undefined
    ? { kind: "percentage", value, reference }
    : { kind: "percentage", value, rangeMax, reference };
};

export const bodyweightLoad = (): Load => ({ kind: "bodyweight" });

export const withoutWeight = (): Load => ({ kind: "without_weight", context: "drop_set_stage" });

export const unspecifiedLoad = (): Load => ({ kind: "unspecified" });

export const percentageRefSelf = (): PercentageReference => ({ scope: "self" });

export const percentageRefMovementFamily = (movementFamily: string): PercentageReference => ({
  scope: "movement_family",
  movementFamily,
});

export const percentageRefOtherExercise = (targetExerciseId: string): PercentageReference => ({
  scope: "other_exercise",
  targetExerciseId,
});
