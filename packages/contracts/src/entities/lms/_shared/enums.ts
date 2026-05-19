import { z } from "zod";

export const FOOTNOTE_TARGETS = ["each_round", "each_set", "each_typed_round"] as const;

export const STANDALONE_LOAD_SCOPES = ["applies_to_all_preceding_rows"] as const;

export const CONNECTOR_FORMS = ["then", "then_dots", "then_n_rounds"] as const;

export const COUNT_FORMS = ["exact", "range", "count_times_reps"] as const;

export const STAGE_INDICATORS = ["explode", "without_weight"] as const;

export const STAGED_PROGRAM_KINDS = ["drop_set", "wave", "cluster"] as const;

export const OR_ALTERNATIVE_PURPOSES = [
  "scale_down",
  "equipment_substitute",
  "coach_choice",
] as const;

export const PLACEHOLDER_KINDS = [
  "muscle_group_reference",
  "purpose_category",
  "coach_choice_slot",
] as const;

export const footnoteTargetSchema = z.enum(FOOTNOTE_TARGETS);
export const standaloneLoadScopeSchema = z.enum(STANDALONE_LOAD_SCOPES);
export const connectorFormSchema = z.enum(CONNECTOR_FORMS);
export const countFormSchema = z.enum(COUNT_FORMS);
export const stageIndicatorSchema = z.enum(STAGE_INDICATORS);
export const stagedProgramKindSchema = z.enum(STAGED_PROGRAM_KINDS);
export const orAlternativePurposeSchema = z.enum(OR_ALTERNATIVE_PURPOSES);
export const placeholderKindSchema = z.enum(PLACEHOLDER_KINDS);

export type FootnoteTarget = (typeof FOOTNOTE_TARGETS)[number];
export type StandaloneLoadScope = (typeof STANDALONE_LOAD_SCOPES)[number];
export type ConnectorForm = (typeof CONNECTOR_FORMS)[number];
export type CountForm = (typeof COUNT_FORMS)[number];
export type StageIndicator = (typeof STAGE_INDICATORS)[number];
export type StagedProgramKind = (typeof STAGED_PROGRAM_KINDS)[number];
export type OrAlternativePurpose = (typeof OR_ALTERNATIVE_PURPOSES)[number];
export type PlaceholderKind = (typeof PLACEHOLDER_KINDS)[number];
