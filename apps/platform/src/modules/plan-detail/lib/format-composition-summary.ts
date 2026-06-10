import {
  type Composition,
  type CompositionLabelKind,
  type CompositionStructure,
  DEFAULT_INTERLEAVE_ORDER,
  isStructurallyParallel,
  type RepetitionAxis,
  type RestAxis,
} from "@repo/contracts/lms/composition";

import { ARRANGEMENT_LABELS, INTERLEAVE_ORDER_LABELS } from "./compose-axis-labels";

const MINUTE_MARK = "’";
const SECOND_MARK = " sec";
const STEP_SEPARATOR = "-";
const ORDERED = "ordered";
const PARALLEL: CompositionLabelKind = "parallel";

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

const arrangementLabel = (arrangement: Composition["arrangement"]): string | null => {
  if (arrangement === undefined || arrangement.kind === ORDERED) {
    return null;
  }

  return ARRANGEMENT_LABELS.superset;
};

const parallelLabel = (composition: Composition): string =>
  `${PARALLEL} (${INTERLEAVE_ORDER_LABELS[composition.interleaveOrder ?? DEFAULT_INTERLEAVE_ORDER]})`;

const buildStructuralParts = (
  composition: Composition,
  structure?: CompositionStructure,
): CompositionSummaryPart[] => {
  const parts: CompositionSummaryPart[] = [];

  if (structure !== undefined && isStructurallyParallel(composition, structure)) {
    parts.push({ text: parallelLabel(composition) });
  }

  if (composition.repetition !== undefined) {
    parts.push({ text: repetitionLabel(composition.repetition) });
  }

  const arrangement = arrangementLabel(composition.arrangement);

  if (arrangement !== null) {
    parts.push({ text: arrangement });
  }

  if (composition.rest !== undefined) {
    parts.push({ text: restLabel(composition.rest) });
  }

  return parts;
};

export const formatStructuralSummary = (
  composition: Composition,
  structure?: CompositionStructure,
): string[] => buildStructuralParts(composition, structure).map((part) => part.text);

export const formatCompositionSummary = (
  composition: Composition,
  structure?: CompositionStructure,
): CompositionSummaryPart[] => buildStructuralParts(composition, structure);
