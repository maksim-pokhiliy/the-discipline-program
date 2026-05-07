import { type z } from "zod";

import { type SchemeParams, type SchemeParamsTimeBoxed } from "@repo/contracts/lms/_domain";
import { type createSchemeTypeSchema } from "@repo/contracts/lms/scheme-type";

type ContractSchemeTypeFormValues = z.input<typeof createSchemeTypeSchema>;

type ContractTimeBoxedSegment = SchemeParamsTimeBoxed["segments"][number];

type FormTimeBoxedSegment = Omit<ContractTimeBoxedSegment, "innerParams"> & {
  innerParams: SchemeParams;
};

type FormSchemeParamsTimeBoxed = Omit<SchemeParamsTimeBoxed, "segments"> & {
  segments: FormTimeBoxedSegment[];
};

type FormSchemeParams = Exclude<SchemeParams, SchemeParamsTimeBoxed> | FormSchemeParamsTimeBoxed;

export type SchemeTypeFormValues = Omit<ContractSchemeTypeFormValues, "defaultParams"> & {
  defaultParams?: FormSchemeParams;
};

export type SchemeParamsBasePath = "defaultParams" | `defaultParams.segments.${number}.innerParams`;

export type SchemeParamsKindPath =
  | "archetypeKind"
  | `defaultParams.segments.${number}.innerArchetypeKind`;
