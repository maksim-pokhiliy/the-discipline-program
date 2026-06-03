import { z } from "zod";

import type { Composition } from "./composition.types";

export const COMPOSITION_LABEL_KINDS = [
  "parallel",
  "superset",
  "ladder",
  "cadence",
  "interval",
  "window",
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

const KIND_TO_FAMILY: Record<CompositionLabelKind, CompositionLabelFamily> = {
  parallel: "PARALLEL",
  superset: "SUPERSET",
  ladder: "LADDER",
  cadence: "INTERVALIC",
  interval: "INTERVALIC",
  window: "INTERVALIC",
  timeCap: "TIME_BOUNDED",
  rounds: "ROUNDS",
  flat: "FLAT",
};

const deriveKind = (composition: Composition): CompositionLabelKind => {
  if (composition.arrangement?.kind === "parallel") {
    return "parallel";
  }

  if (composition.arrangement?.kind === "superset") {
    return "superset";
  }

  const repetitionKind = composition.repetition?.kind;

  if (repetitionKind === "ladder") {
    return "ladder";
  }

  if (
    repetitionKind === "cadence" ||
    repetitionKind === "interval" ||
    repetitionKind === "window"
  ) {
    return repetitionKind;
  }

  if (repetitionKind === "timeCap") {
    return "timeCap";
  }

  if (repetitionKind === "count" || repetitionKind === "range") {
    return "rounds";
  }

  return "flat";
};

export const deriveCompositionLabel = (composition: Composition): CompositionLabel => {
  const kind = deriveKind(composition);

  return { kind, family: KIND_TO_FAMILY[kind] };
};
