import { type ArchetypeParams } from "@repo/contracts/lms/schema";

import { formatRestSpec } from "./format-rest-spec";

const ROUNDS_SUFFIX = " rounds";
const REPS_SUFFIX = " reps";
const RANGE_SEPARATOR = "–";
const TIMES_SEPARATOR = " × ";
const SETS_SUFFIX = " sets";
const PAIRS_SUFFIX = " pairs";
const PARALLEL_LADDERS_SUFFIX = " parallel ladders";
const PARALLEL_PYRAMIDS_SUFFIX = " parallel pyramids";
const STEPS_SEPARATOR = "-";
const SET_ENUMERATION_SEPARATOR = " | ";
const AMRAP_PREFIX = "AMRAP ";
const EMOM_PREFIX = "EMOM ";
const MIN_SUFFIX = " min";
const ARROW_SEPARATOR = " → ";
const INTERVALS_SUFFIX = " intervals";
const REST_PREFIX = "rest ";
const THEN_PREFIX = "then ";
const WORK_REST_SEPARATOR = " min work / ";
const REST_TOKEN_SUFFIX = " min rest";
const PROGRESSIVE_SUFFIX = " min · progressive";
const ON_OFF_SEPARATOR = "on/";
const ON_OFF_TAIL_SUFFIX = "off + max tail";
const EVERY_PREFIX = "every ";
const ROLLING_ROUNDS_INFIX = ROUNDS_SUFFIX + " · ";
const TOTAL_SUFFIX = " min total";
const ROLLING_DURATION_INFIX = MIN_SUFFIX + " · ";
const MIN_SLOT_SINGLE_PREFIX = "min ";
const MINS_SLOT_GROUPED_PREFIX = "mins ";
const MINS_GROUPED_JOIN = ", ";
const OUTER_ROUNDS_SUFFIX = " outer rounds";
const THEME_QUOTE = "'";
const TOTAL_COUNTER_TEXT = "total counter";
const RUN_PREFIX = "Run ";
const RUN_FALLBACK = "Run";
const SPACE = " ";
const PROGRESSIVE_VALUE_SEPARATOR = "/";
const PROGRAM_KIND_UNDERSCORE_RE = /_/g;
const PROGRAM_KIND_SPACE = " ";

const ORDINAL_SUFFIXES = ["th", "st", "nd", "rd"] as const;
const ORDINAL_TEEN_THRESHOLD = 100;
const ORDINAL_OFFSET = 20;
const ORDINAL_DIVISOR = 10;

const ordinal = (n: number): string => {
  const v = n % ORDINAL_TEEN_THRESHOLD;
  const offsetSuffix = ORDINAL_SUFFIXES[(v - ORDINAL_OFFSET) % ORDINAL_DIVISOR];
  const directSuffix = ORDINAL_SUFFIXES[v];
  const suffix = offsetSuffix ?? directSuffix ?? ORDINAL_SUFFIXES[0];

  return `${n}${suffix}`;
};

const formatCountOrRange = (c: number | { min: number; max: number }): string => {
  if (typeof c === "number") {
    return String(c);
  }

  return `${c.min}${RANGE_SEPARATOR}${c.max}`;
};

const formatNRounds = (
  params: Extract<ArchetypeParams, { archetype: "n-rounds" }>["params"],
): string[] => {
  const out: string[] = [];

  if (params.countForm === "exact" && params.count !== undefined) {
    out.push(`${params.count}${ROUNDS_SUFFIX}`);
  } else if (params.countForm === "range" && params.countRange !== undefined) {
    out.push(`${params.countRange.min}${RANGE_SEPARATOR}${params.countRange.max}${ROUNDS_SUFFIX}`);
  } else if (
    params.countForm === "count_times_reps" &&
    params.count !== undefined &&
    params.repsPerSet !== undefined
  ) {
    out.push(`${params.count}${TIMES_SEPARATOR}${params.repsPerSet}`);
  }

  if (params.repsPerSet !== undefined && params.countForm !== "count_times_reps") {
    out.push(`${params.repsPerSet}${REPS_SUFFIX}`);
  }

  if (params.rest !== undefined) {
    out.push(formatRestSpec(params.rest));
  }

  return out;
};

const formatParallelLadders = (
  params: Extract<
    ArchetypeParams,
    { archetype: "parallel-ladders-descending" | "parallel-ladders-mixed-direction" }
  >["params"],
): string[] => {
  const out: string[] = [`${params.ladders.length}${PARALLEL_LADDERS_SUFFIX}`];

  for (const ladder of params.ladders) {
    const directionSuffix = ladder.direction !== undefined ? ` (${ladder.direction})` : "";

    out.push(`${ladder.steps.join(STEPS_SEPARATOR)}${directionSuffix}`);
  }

  return out;
};

const formatRunDistance = (
  params: Extract<ArchetypeParams, { archetype: "run-distance" }>["params"],
): string[] => {
  const distance = params.distance;

  if (distance === undefined) {
    return [RUN_FALLBACK];
  }

  if (distance.value !== undefined) {
    return [`${RUN_PREFIX}${distance.value}${SPACE}${distance.unit}`];
  }

  if (distance.range !== undefined) {
    return [
      `${RUN_PREFIX}${distance.range.min}${RANGE_SEPARATOR}${distance.range.max}${SPACE}${distance.unit}`,
    ];
  }

  return [RUN_FALLBACK];
};

export const formatArchetypeParams = (archetypeParams: ArchetypeParams): string[] => {
  switch (archetypeParams.archetype) {
    case "n-rounds":
      return formatNRounds(archetypeParams.params).filter((s) => s.length > 0);
    case "alternating-sets": {
      const enumeration = archetypeParams.params.setEnumeration
        .map((n) => ordinal(n))
        .join(SET_ENUMERATION_SEPARATOR);

      return [`${enumeration}${SETS_SUFFIX}`];
    }
    case "ladder-descending":
    case "ladder-ascending":
    case "ladder-vertex-down-pyramid":
    case "ladder-spike":
      return [archetypeParams.params.steps.join(STEPS_SEPARATOR)];
    case "parallel-ladders-descending":
    case "parallel-ladders-mixed-direction":
      return formatParallelLadders(archetypeParams.params);
    case "parallel-pyramids":
      return [`${archetypeParams.params.pyramids.length}${PARALLEL_PYRAMIDS_SUFFIX}`];
    case "amrap-flat":
      return [`${AMRAP_PREFIX}${archetypeParams.params.durationMin}${MIN_SUFFIX}`];
    case "time-window-outer":
      return [
        `${archetypeParams.params.window.startHhMm}${ARROW_SEPARATOR}${archetypeParams.params.window.endHhMm}`,
      ];
    case "composite-rounds-with-rest":
      return [
        `${formatCountOrRange(archetypeParams.params.count)}${ROUNDS_SUFFIX}`,
        formatRestSpec(archetypeParams.params.rest),
      ];
    case "composite-intervals-then-rounds":
      return [
        `${archetypeParams.params.intervalsCount}${INTERVALS_SUFFIX}`,
        `${REST_PREFIX}${archetypeParams.params.restMin}${MIN_SUFFIX}`,
        `${THEN_PREFIX}${archetypeParams.params.innerRounds}${ROUNDS_SUFFIX}`,
      ];
    case "composite-intervals-work-rest-fixed":
      return [
        `${archetypeParams.params.intervalsCount}${TIMES_SEPARATOR}${archetypeParams.params.workMin}${WORK_REST_SEPARATOR}${archetypeParams.params.restMin}${REST_TOKEN_SUFFIX}`,
      ];
    case "composite-intervals-work-rest-progressive": {
      const { sets, workMin, offMin, progressiveSeed } = archetypeParams.params;

      return [
        `${sets}${TIMES_SEPARATOR}${workMin}${PROGRESSIVE_VALUE_SEPARATOR}${offMin}${PROGRESSIVE_SUFFIX}`,
        progressiveSeed,
      ];
    }
    case "composite-intervals-on-off-max-tail": {
      const { intervals, onMin, offMin } = archetypeParams.params;

      return [
        `${intervals}${TIMES_SEPARATOR}${onMin}${ON_OFF_SEPARATOR}${offMin}${ON_OFF_TAIL_SUFFIX}`,
      ];
    }
    case "composite-rolling-rounds": {
      const { everyNthMin, rounds, totalMin } = archetypeParams.params;

      return [
        `${EVERY_PREFIX}${everyNthMin}${ROLLING_DURATION_INFIX}${rounds}${ROLLING_ROUNDS_INFIX}${totalMin}${TOTAL_SUFFIX}`,
      ];
    }
    case "emom-nested-per-minute": {
      const out: string[] = [`${EMOM_PREFIX}${archetypeParams.params.durationMin}${MIN_SUFFIX}`];

      if (archetypeParams.params.rounds !== undefined) {
        out.push(`${archetypeParams.params.rounds}${ROUNDS_SUFFIX}`);
      }

      return out;
    }
    case "emom-sub-minute-slot": {
      const { slot } = archetypeParams.params;

      if (slot.kind === "single") {
        return [`${MIN_SLOT_SINGLE_PREFIX}${slot.minute}`];
      }

      return [`${MINS_SLOT_GROUPED_PREFIX}${slot.minutes.join(MINS_GROUPED_JOIN)}`];
    }
    case "nested-rounds-over-rounds":
    case "nested-rounds-over-parallel-ladder":
      return [`${formatCountOrRange(archetypeParams.params.outerCount)}${OUTER_ROUNDS_SUFFIX}`];
    case "nested-composite-rounds-over-ladder":
      return [
        `${archetypeParams.params.outerCount}${OUTER_ROUNDS_SUFFIX}`,
        formatRestSpec(archetypeParams.params.rest),
      ];
    case "named-themed-sets":
      return [
        `${formatCountOrRange(archetypeParams.params.count)}${SETS_SUFFIX}`,
        `${THEME_QUOTE}${archetypeParams.params.theme}${THEME_QUOTE}`,
      ];
    case "named-exercise-program":
      return [
        archetypeParams.params.program.programKind.replace(
          PROGRAM_KIND_UNDERSCORE_RE,
          PROGRAM_KIND_SPACE,
        ),
      ];
    case "single-line-total-counter":
      return [TOTAL_COUNTER_TEXT];
    case "run-distance":
      return formatRunDistance(archetypeParams.params);
    case "super-set": {
      const out: string[] = [
        `${archetypeParams.params.pairs.length}${PAIRS_SUFFIX}`,
        `${archetypeParams.params.rounds}${ROUNDS_SUFFIX}`,
      ];

      if (archetypeParams.params.restBetweenPairs !== undefined) {
        out.push(formatRestSpec(archetypeParams.params.restBetweenPairs));
      }

      return out;
    }
    case "single-line-with-then-connector":
    case "single-line-bare":
    case "flat-list-headerless":
    case "pull-ups-dips-cycle":
    case "placeholder-body":
    case "practice-list":
    case "url-only-body":
      return [];
  }
};
