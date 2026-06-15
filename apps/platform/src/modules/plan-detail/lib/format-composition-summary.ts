import {
  type Composition,
  type RepetitionAxis,
  type RestAxis,
} from "@repo/contracts/lms/composition";

import { formatRestSpec } from "./format-rest-spec";

const MINUTE_MARK = "’";
const STEP_SEPARATOR = "-";

export type CompositionSummaryPart = { text: string };

const repetitionLabel = (repetition: RepetitionAxis): string => {
  switch (repetition.kind) {
    case "once":
      return "once";
    case "count":
      return typeof repetition.count === "number"
        ? `${repetition.count} rounds`
        : `${repetition.count.min}${STEP_SEPARATOR}${repetition.count.max} rounds`;
    case "ladder":
      return `ladder ${repetition.steps.join(STEP_SEPARATOR)}`;
    case "timeCap":
      return `cap ${repetition.cap.min}${MINUTE_MARK}`;
    case "cadence":
      return `EMOM ${repetition.everyMin}${MINUTE_MARK}×${repetition.rounds}`;
    case "interval":
      return `${repetition.count}×${repetition.workMin}${MINUTE_MARK}/${repetition.offMin}${MINUTE_MARK}`;
    default:
      return repetition satisfies never;
  }
};

const restLabel = (rest: RestAxis): string => formatRestSpec(rest);

const buildStructuralParts = (composition: Composition): CompositionSummaryPart[] => {
  const parts: CompositionSummaryPart[] = [];

  if (composition.repetition !== undefined) {
    parts.push({ text: repetitionLabel(composition.repetition) });
  }

  if (composition.rest !== undefined) {
    parts.push({ text: restLabel(composition.rest) });
  }

  return parts;
};

export const formatStructuralSummary = (composition: Composition): string[] =>
  buildStructuralParts(composition).map((part) => part.text);

export const formatCompositionSummary = (composition: Composition): CompositionSummaryPart[] =>
  buildStructuralParts(composition);

export const formatRepetitionLabel = (composition: Composition): string | null =>
  composition.repetition !== undefined ? repetitionLabel(composition.repetition) : null;

export const formatRestSummary = (composition: Composition): string | null =>
  composition.rest !== undefined ? restLabel(composition.rest) : null;
