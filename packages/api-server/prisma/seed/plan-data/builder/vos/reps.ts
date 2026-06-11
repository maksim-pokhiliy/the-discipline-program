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

export const maxReps = (tail?: string): RepNotation =>
  tail === undefined ? { kind: "max" } : { kind: "max", tail };
