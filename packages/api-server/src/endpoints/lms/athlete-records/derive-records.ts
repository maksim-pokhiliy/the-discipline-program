import { type Result, RESULT_DIRECTIONS } from "@repo/contracts/lms";

export type BenchmarkResultEntry = { result: Result; recordedAt: Date };

const scoreVector = (result: Result): number[] => {
  switch (result.type) {
    case "time":
      return [result.seconds];
    case "rounds_reps":
      return [result.rounds, result.reps];
    case "load":
      return [result.kg];
    case "max_reps":
      return [result.reps];
    case "distance":
      return [result.value];
    case "calories":
      return [result.value];
    default:
      result satisfies never;

      return [];
  }
};

const compareVectors = (a: number[], b: number[]): number => {
  for (let index = 0; index < a.length; index++) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;

    if (left !== right) {
      return left - right;
    }
  }

  return 0;
};

const beats = (candidate: Result, incumbent: Result): boolean => {
  const delta = compareVectors(scoreVector(candidate), scoreVector(incumbent));

  return RESULT_DIRECTIONS[candidate.type] === "lower" ? delta < 0 : delta > 0;
};

export const deriveBestResult = (entries: BenchmarkResultEntry[]): Result | null => {
  let best: Result | null = null;

  for (const entry of entries) {
    if (best === null || beats(entry.result, best)) {
      best = entry.result;
    }
  }

  return best;
};

export const isNewPR = (prior: Result | null, candidate: Result): boolean =>
  prior === null || beats(candidate, prior);

export const buildResultSeries = (entries: BenchmarkResultEntry[]): BenchmarkResultEntry[] =>
  [...entries].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
