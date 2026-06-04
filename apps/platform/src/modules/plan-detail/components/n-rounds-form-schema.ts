import { z } from "zod";

import type { ArchetypeParams } from "@repo/contracts/lms/schema";

import { restSpecFormSchema, type RestSpecFormValue } from "./rest-spec-fields";
import type { SchemaEditorMode } from "./schema-editor-types";

export type NRoundsParams = Extract<ArchetypeParams, { archetype: "n-rounds" }>["params"];

export const DEFAULT_COUNT = 5;
export const DEFAULT_RANGE_MIN = 3;
export const DEFAULT_RANGE_MAX = 5;
export const DEFAULT_REPS_PER_SET = 8;
export const DEFAULT_REST_VALUE = 90;

const positiveInt = z.number().int().positive();

export const nRoundsFormSchema = z.discriminatedUnion("countForm", [
  z.object({
    countForm: z.literal("exact"),
    count: positiveInt,
    rest: restSpecFormSchema.optional(),
  }),
  z.object({
    countForm: z.literal("range"),
    countRange: z
      .object({ min: positiveInt, max: positiveInt })
      .refine((r) => r.min < r.max, { message: "min must be less than max", path: ["max"] }),
    rest: restSpecFormSchema.optional(),
  }),
  z.object({
    countForm: z.literal("count_times_reps"),
    count: positiveInt,
    repsPerSet: positiveInt,
    rest: restSpecFormSchema.optional(),
  }),
]);

export type NRoundsFormData = z.infer<typeof nRoundsFormSchema>;
export type CountForm = NRoundsFormData["countForm"];

export const COUNT_FORM_OPTIONS: { value: CountForm; label: string }[] = [
  { value: "exact", label: "Exact" },
  { value: "range", label: "Range" },
  { value: "count_times_reps", label: "Count × reps" },
];

export const DEFAULT_REST: RestSpecFormValue = {
  duration: { value: DEFAULT_REST_VALUE, unit: "sec" },
  scope: "between_rounds",
};

export const buildBranchDefaults = (countForm: CountForm): NRoundsFormData => {
  if (countForm === "exact") {
    return { countForm: "exact", count: DEFAULT_COUNT };
  }

  if (countForm === "range") {
    return {
      countForm: "range",
      countRange: { min: DEFAULT_RANGE_MIN, max: DEFAULT_RANGE_MAX },
    };
  }

  return { countForm: "count_times_reps", count: DEFAULT_COUNT, repsPerSet: DEFAULT_REPS_PER_SET };
};

export const toFormData = (mode: SchemaEditorMode): NRoundsFormData => {
  if (mode.kind === "create") {
    return buildBranchDefaults("exact");
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams === null) {
    return buildBranchDefaults("exact");
  }

  if (archetypeParams.archetype !== "n-rounds") {
    return buildBranchDefaults("exact");
  }

  const { params } = archetypeParams;
  const rest = params.rest;

  if (params.countForm === "range") {
    return {
      countForm: "range",
      countRange: params.countRange ?? { min: DEFAULT_RANGE_MIN, max: DEFAULT_RANGE_MAX },
      ...(rest && { rest }),
    };
  }

  if (params.countForm === "count_times_reps") {
    return {
      countForm: "count_times_reps",
      count: params.count ?? DEFAULT_COUNT,
      repsPerSet: params.repsPerSet ?? DEFAULT_REPS_PER_SET,
      ...(rest && { rest }),
    };
  }

  return { countForm: "exact", count: params.count ?? DEFAULT_COUNT, ...(rest && { rest }) };
};

export const buildParams = (data: NRoundsFormData): NRoundsParams => {
  if (data.countForm === "exact") {
    return { countForm: "exact", count: data.count, ...(data.rest && { rest: data.rest }) };
  }

  if (data.countForm === "range") {
    return {
      countForm: "range",
      countRange: data.countRange,
      ...(data.rest && { rest: data.rest }),
    };
  }

  return {
    countForm: "count_times_reps",
    count: data.count,
    repsPerSet: data.repsPerSet,
    ...(data.rest && { rest: data.rest }),
  };
};
