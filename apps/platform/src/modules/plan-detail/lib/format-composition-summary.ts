import { type ResultType, type TimeCap } from "@repo/contracts/lms/_shared";
import {
  type Composition,
  type RepetitionAxis,
  type RestAxis,
  formatRestSpec,
} from "@repo/contracts/lms/composition";

const MINUTE_MARK = "’";
const SECOND_MARK = "s";
const COLON = ":";
const CAP_PREFIX = "cap ";
const BENCHMARK_PREFIX = "benchmark ";

const RESULT_TYPE_SHORT: Record<ResultType, string> = {
  time: "time",
  rounds_reps: "rounds+reps",
  load: "load",
  max_reps: "max reps",
  distance: "distance",
  calories: "cal",
};
const STEP_SEPARATOR = "-";
const RANGE_SEPARATOR = "–";
const INTERVAL_PAIR_SEPARATOR = "/";
const COUNT_MARK = "×";

export type CompositionSummaryPart = { text: string };

type IntervalDuration = Extract<RepetitionAxis, { kind: "interval" }>["work"];

const intervalDurationLabel = (duration: IntervalDuration): string =>
  duration.unit === "sec" ? `${COLON}${duration.value}` : `${duration.value}${MINUTE_MARK}`;

const capMark = (cap: TimeCap): string => (cap.unit === "sec" ? SECOND_MARK : MINUTE_MARK);

const capLabel = (cap: TimeCap): string => {
  const mark = capMark(cap);

  return cap.max !== undefined
    ? `${CAP_PREFIX}${cap.min}${RANGE_SEPARATOR}${cap.max}${mark}`
    : `${CAP_PREFIX}${cap.min}${mark}`;
};

const repetitionLabel = (repetition: RepetitionAxis): string => {
  switch (repetition.kind) {
    case "once":
      return "once";
    case "count":
      return typeof repetition.count === "number"
        ? `${repetition.count} rounds`
        : `${repetition.count.min}${STEP_SEPARATOR}${repetition.count.max} rounds`;
    case "ladder":
      return `ladder ${repetition.steps.join(STEP_SEPARATOR)}`;
    case "timeCap":
      return capLabel(repetition.cap);
    case "cadence":
      return `EMOM ${repetition.everyMin}${MINUTE_MARK}${COUNT_MARK}${repetition.rounds}`;
    case "interval":
      return `${repetition.count}${COUNT_MARK}${intervalDurationLabel(repetition.work)}${INTERVAL_PAIR_SEPARATOR}${intervalDurationLabel(repetition.off)}`;
    default:
      return repetition satisfies never;
  }
};

const restLabel = (rest: RestAxis): string => formatRestSpec(rest);

const buildStructuralParts = (composition: Composition): CompositionSummaryPart[] => {
  const parts: CompositionSummaryPart[] = [];

  if (composition.repetition !== undefined) {
    parts.push({ text: repetitionLabel(composition.repetition) });
  }

  if (composition.cap !== undefined) {
    parts.push({ text: capLabel(composition.cap) });
  }

  if (composition.rest !== undefined) {
    parts.push({ text: restLabel(composition.rest) });
  }

  return parts;
};

export const formatStructuralSummary = (composition: Composition): string[] =>
  buildStructuralParts(composition).map((part) => part.text);

export const formatCompositionSummary = (composition: Composition): CompositionSummaryPart[] =>
  buildStructuralParts(composition);

export const formatRepetitionLabel = (composition: Composition): string | null =>
  composition.repetition !== undefined ? repetitionLabel(composition.repetition) : null;

export const formatRestSummary = (composition: Composition): string | null =>
  composition.rest !== undefined ? restLabel(composition.rest) : null;

export const formatCapSummary = (composition: Composition): string | null =>
  composition.cap !== undefined ? capLabel(composition.cap) : null;

export const formatBenchmarkSummary = (composition: Composition): string | null =>
  composition.benchmark != null
    ? `${BENCHMARK_PREFIX}${RESULT_TYPE_SHORT[composition.benchmark.resultType]}`
    : null;
