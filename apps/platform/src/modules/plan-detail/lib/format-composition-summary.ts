import {
  type Composition,
  type RepetitionAxis,
  type RestAxis,
} from "@repo/contracts/lms/composition";

const MINUTE_MARK = "’";
const SECOND_MARK = " sec";
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

const restLabel = (rest: RestAxis): string => {
  const max = rest.duration.rangeMax;
  const range = max === undefined ? `${rest.duration.value}` : `${rest.duration.value}–${max}`;
  const mark = rest.duration.unit.endsWith("min") ? MINUTE_MARK : SECOND_MARK;

  return `rest ${range}${mark}`;
};

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
