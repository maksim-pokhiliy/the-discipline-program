import type { RestSpec, StagedProgram } from "@repo/contracts/lms/_shared";

import type { CanonicalSchemaNode } from "../../canonical-schema";

import type { ExactOrRange } from "./base";
import { type ArchetypeBaseInput, buildArchetypeNode } from "./base";

const RUN_DISTANCE_UNIT = "km" as const;
const RUN_MODALITY = "RUN" as const;

export type NamedThemedSetsInput = ArchetypeBaseInput & {
  count: ExactOrRange;
  theme: string;
};

export const namedThemedSets = (input: NamedThemedSetsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NAMED",
    {
      archetype: "named-themed-sets",
      params: { count: input.count, theme: input.theme },
    },
    input.theme,
  );

export type NamedExerciseProgramInput = ArchetypeBaseInput & {
  exerciseId: string;
  program: StagedProgram;
};

export const namedExerciseProgram = (input: NamedExerciseProgramInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NAMED",
    {
      archetype: "named-exercise-program",
      params: { exerciseId: input.exerciseId, program: input.program },
    },
    null,
  );

export const singleLineWithThenConnector = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "HEADERLESS",
    { archetype: "single-line-with-then-connector", params: {} },
    null,
  );

export const singleLineBare = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "HEADERLESS", { archetype: "single-line-bare", params: {} }, null);

export const singleLineTotalCounter = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "HEADERLESS",
    { archetype: "single-line-total-counter", params: { totalFlag: true } },
    null,
  );

export const flatListHeaderless = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "HEADERLESS", { archetype: "flat-list-headerless", params: {} }, null);

export const pullUpsDipsCycle = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "ATOMIC", { archetype: "pull-ups-dips-cycle", params: {} }, null);

export type RunDistanceInput = ArchetypeBaseInput & {
  distance?: {
    value?: number;
    range?: { min: number; max: number };
  };
};

export const runDistance = (input: RunDistanceInput): CanonicalSchemaNode => {
  const distance = input.distance;

  if (distance === undefined) {
    return buildArchetypeNode(
      input,
      "ATOMIC",
      { archetype: "run-distance", params: { modality: RUN_MODALITY } },
      null,
    );
  }

  const distanceObj: { unit: "km"; value?: number; range?: { min: number; max: number } } = {
    unit: RUN_DISTANCE_UNIT,
  };

  if (distance.value !== undefined) {
    distanceObj.value = distance.value;
  }

  if (distance.range !== undefined) {
    distanceObj.range = distance.range;
  }

  return buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "run-distance", params: { modality: RUN_MODALITY, distance: distanceObj } },
    null,
  );
};

export const placeholderBody = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "HEADERLESS", { archetype: "placeholder-body", params: {} }, null);

export const practiceList = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "HEADERLESS", { archetype: "practice-list", params: {} }, null);

export const urlOnlyBody = (input: ArchetypeBaseInput): CanonicalSchemaNode =>
  buildArchetypeNode(input, "HEADERLESS", { archetype: "url-only-body", params: {} }, null);

export type SuperSetPairInput = { label: string; schemaRows: string[] };

export type SuperSetInput = ArchetypeBaseInput & {
  pairs: SuperSetPairInput[];
  rounds: number;
  restBetweenPairs?: RestSpec;
};

export const superSet = (input: SuperSetInput): CanonicalSchemaNode => {
  if (input.pairs.length === 0) {
    throw new Error("superSet: requires at least 1 pair");
  }

  return buildArchetypeNode(
    input,
    "COMPOSITE",
    {
      archetype: "super-set",
      params: {
        pairs: input.pairs,
        rounds: input.rounds,
        ...(input.restBetweenPairs !== undefined && {
          restBetweenPairs: input.restBetweenPairs,
        }),
      },
    },
    null,
  );
};
