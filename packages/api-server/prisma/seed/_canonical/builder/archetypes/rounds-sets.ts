import type { RestSpec, SlotSpec } from "@repo/contracts/lms/_shared";

import type { CanonicalSchemaNode } from "../../canonical-schema";

import { type ArchetypeBaseInput, buildArchetypeNode } from "./base";

export type NRoundsInput = ArchetypeBaseInput & {
  countForm: "exact" | "range" | "count_times_reps";
  count?: number;
  countRange?: { min: number; max: number };
  repsPerSet?: number;
  rest?: RestSpec;
};

export const nRounds = (input: NRoundsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    {
      archetype: "n-rounds",
      params: {
        countForm: input.countForm,
        ...(input.count !== undefined && { count: input.count }),
        ...(input.countRange !== undefined && { countRange: input.countRange }),
        ...(input.repsPerSet !== undefined && { repsPerSet: input.repsPerSet }),
        ...(input.rest !== undefined && { rest: input.rest }),
      },
    },
    null,
  );

export type AlternatingSetsInput = ArchetypeBaseInput & { setEnumeration: number[] };

export const alternatingSets = (input: AlternatingSetsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "alternating-sets", params: { setEnumeration: input.setEnumeration } },
    null,
  );

export type LadderStepsInput = ArchetypeBaseInput & { steps: number[] };

export const ladderDescending = (input: LadderStepsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "ladder-descending", params: { steps: input.steps } },
    null,
  );

export const ladderAscending = (input: LadderStepsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "ladder-ascending", params: { steps: input.steps } },
    null,
  );

export const ladderVertexDownPyramid = (input: LadderStepsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "ladder-vertex-down-pyramid", params: { steps: input.steps } },
    null,
  );

export const ladderSpike = (input: LadderStepsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "ladder-spike", params: { steps: input.steps } },
    null,
  );

export type ParallelLadderEntry = {
  steps: number[];
  pairedWithInnerRowId?: string;
  direction?: "asc" | "desc";
};

export type ParallelLaddersInput = ArchetypeBaseInput & { ladders: ParallelLadderEntry[] };

export const parallelLaddersDescending = (input: ParallelLaddersInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "parallel-ladders-descending", params: { ladders: input.ladders } },
    null,
  );

export const parallelLaddersMixedDirection = (input: ParallelLaddersInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "parallel-ladders-mixed-direction", params: { ladders: input.ladders } },
    null,
  );

export type ParallelPyramidsInput = ArchetypeBaseInput & { pyramids: ParallelLadderEntry[] };

export const parallelPyramids = (input: ParallelPyramidsInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "parallel-pyramids", params: { pyramids: input.pyramids } },
    null,
  );

export type AmrapFlatInput = ArchetypeBaseInput & { durationMin: number };

export const amrapFlat = (input: AmrapFlatInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "amrap-flat", params: { durationMin: input.durationMin } },
    null,
  );

export type EmomNestedInput = ArchetypeBaseInput & { durationMin: number; rounds?: number };

export const emomNestedPerMinute = (input: EmomNestedInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "NESTED",
    {
      archetype: "emom-nested-per-minute",
      params: {
        durationMin: input.durationMin,
        ...(input.rounds !== undefined && { rounds: input.rounds }),
      },
    },
    null,
  );

export type EmomSubMinuteSlotInput = ArchetypeBaseInput & { slot: SlotSpec };

export const emomSubMinuteSlot = (input: EmomSubMinuteSlotInput): CanonicalSchemaNode =>
  buildArchetypeNode(
    input,
    "ATOMIC",
    { archetype: "emom-sub-minute-slot", params: { slot: input.slot } },
    null,
  );
