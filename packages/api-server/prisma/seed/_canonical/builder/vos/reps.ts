import type { RepNotation } from "@repo/contracts/lms/_shared";

export const countReps = (value: number): RepNotation => ({ kind: "count", value });

export const rangeReps = (min: number, max: number): RepNotation => {
  if (min >= max) {
    throw new Error(`rangeReps: min must be less than max (min=${min}, max=${max})`);
  }

  return { kind: "range", min, max };
};

export type UnitBoundRepsInput = {
  unit: "sec" | "min" | "km";
  value?: number;
  range?: { min: number; max: number };
};

export const unitBoundReps = (input: UnitBoundRepsInput): RepNotation => {
  const hasValue = input.value !== undefined;
  const hasRange = input.range !== undefined;

  if (hasValue === hasRange) {
    throw new Error(
      `unitBoundReps: requires exactly one of value or range (value=${input.value}, range=${JSON.stringify(input.range)})`,
    );
  }

  return input.range === undefined
    ? { kind: "unit_bound", unit: input.unit, value: input.value }
    : { kind: "unit_bound", unit: input.unit, range: input.range };
};

export type MaxRepsInput =
  | { subForm: "bare" }
  | { subForm: "progressive"; progressiveSeed: string }
  | { subForm: "in_remaining_time"; targetExerciseId?: string };

export const maxReps = (input: MaxRepsInput): RepNotation => {
  if (input.subForm === "progressive") {
    return { kind: "max", subForm: "progressive", progressiveSeed: input.progressiveSeed };
  }

  if (input.subForm === "in_remaining_time") {
    return input.targetExerciseId === undefined
      ? { kind: "max", subForm: "in_remaining_time" }
      : { kind: "max", subForm: "in_remaining_time", targetExerciseId: input.targetExerciseId };
  }

  return { kind: "max", subForm: "bare" };
};

export const implicitReps = (): RepNotation => ({ kind: "implicit" });

export const totalFlagReps = (value: number): RepNotation => ({ kind: "total_flag", value });

export const compoundRepUnitReps = (): RepNotation => ({ kind: "compound_rep_unit" });
