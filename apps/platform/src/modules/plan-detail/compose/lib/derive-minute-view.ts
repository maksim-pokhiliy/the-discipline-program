import type { Composition } from "@repo/contracts/lms/composition";

const MIN_PREFIX = "MIN ";
const MIN_ROUNDS = 1;

export type MinuteView =
  | { kind: "none" }
  | { kind: "minutes"; assignments: { rowId: string; minuteLabel: string }[] };

export const deriveMinuteView = (composition: Composition, childRowIds: string[]): MinuteView => {
  const repetition = composition.repetition;

  if (repetition?.kind !== "cadence") {
    return { kind: "none" };
  }

  const rounds = repetition.rounds;

  if (!Number.isInteger(rounds) || rounds < MIN_ROUNDS) {
    return { kind: "none" };
  }

  const assignments = childRowIds.map((rowId, index) => ({
    rowId,
    minuteLabel: `${MIN_PREFIX}${(index % rounds) + 1}`,
  }));

  return { kind: "minutes", assignments };
};
