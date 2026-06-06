import type { Composition, RepetitionAxis, RestAxis } from "@repo/contracts/lms/composition";

import { ARRANGEMENT_LABELS, PROGRAM_KIND_LABELS, SCORING_LABELS } from "./compose-axis-labels";

const MINUTE_MARK = "’";
const SECOND_MARK = " sec";
const STEP_SEPARATOR = "-";
const ORDERED = "ordered";

const repetitionLabel = (repetition: RepetitionAxis): string => {
  switch (repetition.kind) {
    case "once":
      return "once";
    case "count":
      return typeof repetition.count === "number"
        ? `${repetition.count} rounds`
        : `${repetition.count.min}${STEP_SEPARATOR}${repetition.count.max} rounds`;
    case "range":
      return `${repetition.range.min}${STEP_SEPARATOR}${repetition.range.max} rounds`;
    case "ladder":
      return `ladder ${repetition.steps.join(STEP_SEPARATOR)}`;
    case "timeCap":
      return `cap ${repetition.cap.min}${MINUTE_MARK}`;
    case "cadence":
      return `EMOM ${repetition.everyMin}${MINUTE_MARK}×${repetition.rounds}`;
    case "window":
      return `${repetition.startHhMm}–${repetition.endHhMm}`;
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

export const formatCompositionSummary = (composition: Composition): string[] => {
  const parts: string[] = [];

  if (composition.repetition !== undefined) {
    parts.push(repetitionLabel(composition.repetition));
  }

  if (composition.programKind !== undefined) {
    parts.push(PROGRAM_KIND_LABELS[composition.programKind]);
  }

  if (composition.arrangement !== undefined && composition.arrangement.kind !== ORDERED) {
    parts.push(ARRANGEMENT_LABELS[composition.arrangement.kind]);
  }

  if (composition.scoring !== undefined) {
    parts.push(SCORING_LABELS[composition.scoring.kind]);
  }

  if (composition.rest !== undefined) {
    parts.push(restLabel(composition.rest));
  }

  return parts;
};
