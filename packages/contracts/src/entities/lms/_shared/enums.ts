import { z } from "zod";

export const CONNECTOR_FORMS = ["then", "then_dots", "then_n_rounds"] as const;

export const COUNT_FORMS = ["exact", "range", "count_times_reps"] as const;

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

export const connectorFormSchema = z.enum(CONNECTOR_FORMS);
export const countFormSchema = z.enum(COUNT_FORMS);
export const orAlternativePurposeSchema = z.enum(OR_ALTERNATIVE_PURPOSES);
export const placeholderKindSchema = z.enum(PLACEHOLDER_KINDS);

export type ConnectorForm = (typeof CONNECTOR_FORMS)[number];
export type CountForm = (typeof COUNT_FORMS)[number];
export type OrAlternativePurpose = (typeof OR_ALTERNATIVE_PURPOSES)[number];
export type PlaceholderKind = (typeof PLACEHOLDER_KINDS)[number];
