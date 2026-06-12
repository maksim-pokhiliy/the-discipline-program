import type { RepetitionAxis } from "../components/axes/axis-draft.types";
import { REPETITION_DEFAULTS } from "../components/axes/repetition-defaults";
import type { CountOrRangeValue } from "../components/count-or-range-field";

const countOrRangeEquals = (a: CountOrRangeValue, b: CountOrRangeValue): boolean => {
  if (typeof a === "number" || typeof b === "number") {
    return a === b;
  }

  return a.min === b.min && a.max === b.max;
};

const stepsEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((step, index) => step === b[index]);

export const repetitionEquals = (a: RepetitionAxis, b: RepetitionAxis): boolean => {
  if (a.kind !== b.kind) {
    return false;
  }

  switch (a.kind) {
    case "once":
      return true;
    case "count":
      return b.kind === "count" && countOrRangeEquals(a.count, b.count);
    case "ladder":
      return b.kind === "ladder" && stepsEqual(a.steps, b.steps);
    case "timeCap":
      return (
        b.kind === "timeCap" &&
        a.cap.min === b.cap.min &&
        a.cap.max === b.cap.max &&
        a.cap.unit === b.cap.unit
      );
    case "cadence":
      return b.kind === "cadence" && a.everyMin === b.everyMin && a.rounds === b.rounds;
    case "interval":
      return (
        b.kind === "interval" &&
        a.workMin === b.workMin &&
        a.offMin === b.offMin &&
        a.count === b.count
      );
    default:
      return a satisfies never;
  }
};

export const isRepetitionDirty = (value: RepetitionAxis): boolean =>
  !repetitionEquals(value, REPETITION_DEFAULTS[value.kind]);
