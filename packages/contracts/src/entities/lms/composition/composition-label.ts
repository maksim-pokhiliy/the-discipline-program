import { z } from "zod";

import type { Composition } from "./composition.types";

export const COMPOSITION_LABEL_KINDS = [
  "parallel",
  "superset",
  "ladder",
  "cadence",
  "interval",
  "timeCap",
  "rounds",
  "flat",
] as const;
export type CompositionLabelKind = (typeof COMPOSITION_LABEL_KINDS)[number];

export const COMPOSITION_LABEL_FAMILIES = [
  "PARALLEL",
  "SUPERSET",
  "LADDER",
  "INTERVALIC",
  "TIME_BOUNDED",
  "ROUNDS",
  "FLAT",
] as const;
export type CompositionLabelFamily = (typeof COMPOSITION_LABEL_FAMILIES)[number];

export const compositionLabelSchema = z
  .object({
    kind: z.enum(COMPOSITION_LABEL_KINDS),
    family: z.enum(COMPOSITION_LABEL_FAMILIES),
  })
  .strict();
export type CompositionLabel = z.infer<typeof compositionLabelSchema>;

export type CompositionStructure = { containerChildCount: number };

export const isStructurallyParallel = (
  composition: Composition,
  structure: CompositionStructure,
): boolean =>
  structure.containerChildCount >= 2 &&
  (composition.repetition === undefined || composition.repetition.kind === "once") &&
  composition.arrangement === undefined;

const KIND_TO_FAMILY: Record<CompositionLabelKind, CompositionLabelFamily> = {
  parallel: "PARALLEL",
  superset: "SUPERSET",
  ladder: "LADDER",
  cadence: "INTERVALIC",
  interval: "INTERVALIC",
  timeCap: "TIME_BOUNDED",
  rounds: "ROUNDS",
  flat: "FLAT",
};

const deriveKind = (
  composition: Composition,
  structure?: CompositionStructure,
): CompositionLabelKind => {
  if (structure !== undefined && isStructurallyParallel(composition, structure)) {
    return "parallel";
  }

  if (composition.arrangement?.kind === "superset") {
    return "superset";
  }

  const repetitionKind = composition.repetition?.kind;

  if (repetitionKind === "ladder") {
    return "ladder";
  }

  if (repetitionKind === "cadence" || repetitionKind === "interval") {
    return repetitionKind;
  }

  if (repetitionKind === "timeCap") {
    return "timeCap";
  }

  if (repetitionKind === "count") {
    return "rounds";
  }

  return "flat";
};

export const deriveCompositionLabel = (
  composition: Composition,
  structure?: CompositionStructure,
): CompositionLabel => {
  const kind = deriveKind(composition, structure);

  return { kind, family: KIND_TO_FAMILY[kind] };
};
