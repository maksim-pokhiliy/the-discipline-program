import type { Composition } from "@repo/contracts/lms/composition";

import type { ExactOrRange } from "./base";

type RepetitionFragment = Pick<Composition, "repetition">;

export const rounds = (count: ExactOrRange): RepetitionFragment => ({
  repetition: { kind: "count", count },
});

export const ladderRep = (steps: number[]): RepetitionFragment => ({
  repetition: { kind: "ladder", steps },
});

export const cadenceRep = (everyMin: number, rounds: number): RepetitionFragment => ({
  repetition: {
    kind: "cadence",
    everyMin,
    rounds,
  },
});

export const intervalRep = (
  workMin: number,
  offMin: number,
  count: number,
): RepetitionFragment => ({
  repetition: { kind: "interval", workMin, offMin, count },
});
