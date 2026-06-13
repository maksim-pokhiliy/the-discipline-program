import type { Load, PercentageReference } from "@repo/contracts/lms/_shared";

export const absoluteLoad = (input: { count: 1 | 2; kg: number }): Load => ({
  kind: "absolute",
  count: input.count,
  kg: input.kg,
});

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

export const byProfileLoad = (entries: { label: string; kg: number }[]): Load => ({
  kind: "byProfile",
  entries,
});

export const percentageRefSelf = (): PercentageReference => ({ scope: "self" });

export const percentageRefOtherExercise = (targetExerciseId: string): PercentageReference => ({
  scope: "other_exercise",
  targetExerciseId,
});
