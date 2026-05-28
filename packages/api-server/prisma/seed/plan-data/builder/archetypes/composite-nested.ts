import type { ExerciseForm, RepNotation, RestSpec } from "@repo/contracts/lms/_shared";

import type { CanonicalSchemaNode } from "../../canonical-schema";

import { type ArchetypeBaseInput, type ExactOrRange, buildArchetypeNode } from "./base";

export type TimeWindowOuterInput = ArchetypeBaseInput & {
  window: { startHhMm: string; endHhMm: string };
};

export const timeWindowOuter = (input: TimeWindowOuterInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    { archetype: "time-window-outer", params: { window: input.window } },
    null,
  );

export type CompositeRoundsWithRestInput = ArchetypeBaseInput & {
  count: ExactOrRange;
  rest: RestSpec;
};

export const compositeRoundsWithRest = (input: CompositeRoundsWithRestInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    {
      archetype: "composite-rounds-with-rest",
      params: { count: input.count, rest: input.rest },
    },
    null,
  );

export type CompositeIntervalsThenRoundsInput = ArchetypeBaseInput & {
  intervalsCount: number;
  restMin: number;
  innerRounds: number;
  preambleExercise: ExerciseForm;
  preambleReps: RepNotation;
};

export const compositeIntervalsThenRounds = (
  input: CompositeIntervalsThenRoundsInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "composite-intervals-then-rounds",
      params: {
        intervalsCount: input.intervalsCount,
        restMin: input.restMin,
        innerRounds: input.innerRounds,
        preambleExercise: input.preambleExercise,
        preambleReps: input.preambleReps,
      },
    },
    null,
  );

export type CompositeIntervalsWorkRestFixedInput = ArchetypeBaseInput & {
  intervalsCount: number;
  workMin: number;
  restMin: number;
};

export const compositeIntervalsWorkRestFixed = (
  input: CompositeIntervalsWorkRestFixedInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "composite-intervals-work-rest-fixed",
      params: {
        intervalsCount: input.intervalsCount,
        workMin: input.workMin,
        restMin: input.restMin,
      },
    },
    null,
  );

export type CompositeIntervalsWorkRestProgressiveInput = ArchetypeBaseInput & {
  sets: number;
  workMin: number;
  offMin: number;
  progressiveSeed: string;
};

export const compositeIntervalsWorkRestProgressive = (
  input: CompositeIntervalsWorkRestProgressiveInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "composite-intervals-work-rest-progressive",
      params: {
        sets: input.sets,
        workMin: input.workMin,
        offMin: input.offMin,
        progressiveSeed: input.progressiveSeed,
      },
    },
    null,
  );

export type CompositeIntervalsOnOffMaxTailInput = ArchetypeBaseInput & {
  intervals: number;
  onMin: number;
  offMin: number;
  tailExerciseId: string;
};

export const compositeIntervalsOnOffMaxTail = (
  input: CompositeIntervalsOnOffMaxTailInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "composite-intervals-on-off-max-tail",
      params: {
        intervals: input.intervals,
        onMin: input.onMin,
        offMin: input.offMin,
        tailExerciseId: input.tailExerciseId,
      },
    },
    null,
  );

export type CompositeRollingRoundsInput = ArchetypeBaseInput & {
  everyNthMin: number;
  rounds: number;
  totalMin: number;
};

export const compositeRollingRounds = (input: CompositeRollingRoundsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "composite-rolling-rounds",
      params: {
        everyNthMin: input.everyNthMin,
        rounds: input.rounds,
        totalMin: input.totalMin,
      },
    },
    null,
  );

export type NestedRoundsOverRoundsInput = ArchetypeBaseInput & { outerCount: ExactOrRange };

export const nestedRoundsOverRounds = (input: NestedRoundsOverRoundsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    {
      archetype: "nested-rounds-over-rounds",
      params: { outerCount: input.outerCount },
    },
    null,
  );

export const nestedRoundsOverParallelLadder = (
  input: NestedRoundsOverRoundsInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    {
      archetype: "nested-rounds-over-parallel-ladder",
      params: { outerCount: input.outerCount },
    },
    null,
  );

export type NestedCompositeRoundsOverLadderInput = ArchetypeBaseInput & {
  outerCount: number;
  rest: RestSpec;
};

export const nestedCompositeRoundsOverLadder = (
  input: NestedCompositeRoundsOverLadderInput,
): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    {
      archetype: "nested-composite-rounds-over-ladder",
      params: { outerCount: input.outerCount, rest: input.rest },
    },
    null,
  );
