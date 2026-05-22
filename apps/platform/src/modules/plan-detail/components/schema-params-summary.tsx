"use client";

import { Chip } from "@mui/material";

import type { ArchetypeParams } from "@repo/contracts/lms/schema";

type NRoundsParams = Extract<ArchetypeParams, { archetype: "n-rounds" }>["params"];
type AmrapFlatParams = Extract<ArchetypeParams, { archetype: "amrap-flat" }>["params"];

const formatRest = (rest: NonNullable<NRoundsParams["rest"]>): string => {
  const { value, unit, rangeMax } = rest.duration;
  const amount = rangeMax !== undefined ? `${value}-${rangeMax}` : `${value}`;

  return `rest ${amount} ${unit}`;
};

const formatNRounds = (params: NRoundsParams): string => {
  const restPart = params.rest !== undefined ? `, ${formatRest(params.rest)}` : "";

  if (params.countForm === "range" && params.countRange !== undefined) {
    return `${params.countRange.min}-${params.countRange.max} rounds${restPart}`;
  }

  if (params.countForm === "count_times_reps" && params.repsPerSet !== undefined) {
    return `${params.count ?? "?"} rounds × ${params.repsPerSet} reps${restPart}`;
  }

  return `${params.count ?? "?"} rounds${restPart}`;
};

const formatAmrapFlat = (params: AmrapFlatParams): string => `AMRAP ${params.durationMin} min`;

type SchemaParamsSummaryProps = {
  archetypeParams: ArchetypeParams;
};

export const SchemaParamsSummary = ({ archetypeParams }: SchemaParamsSummaryProps) => {
  switch (archetypeParams.archetype) {
    case "amrap-flat":
      return <Chip size="small" label={formatAmrapFlat(archetypeParams.params)} />;
    case "n-rounds":
      return <Chip size="small" label={formatNRounds(archetypeParams.params)} />;
    default:
      return null;
  }
};
