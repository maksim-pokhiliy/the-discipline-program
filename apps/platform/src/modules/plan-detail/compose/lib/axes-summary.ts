import type {
  ArrangementAxis,
  ComposeContainer,
  RepetitionAxis,
  RestAxis,
  ScoringDirective,
} from "../compose-tree.types";

const MINUTE_MARK = "’";
const STEP_SEPARATOR = "-";
const DASH_SEPARATOR = " · ";

const SCORING_LABELS: Record<ScoringDirective["kind"], string> = {
  prescribed: "prescribed",
  amrap: "AMRAP",
  for_time: "for time",
  max_in_remaining: "max-in-remaining",
  total: "total",
  progressive: "progressive",
};

const ARRANGEMENT_LABELS: Record<ArrangementAxis["kind"], string> = {
  ordered: "ordered",
  parallel: "parallel",
  superset: "superset",
};

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
    case "window":
      return `${repetition.startHhMm}–${repetition.endHhMm}`;
    case "interval":
      return `${repetition.count}×${repetition.workMin}${MINUTE_MARK}/${repetition.offMin}${MINUTE_MARK}`;
    default:
      repetition satisfies never;

      return "";
  }
};

const restLabel = (rest: RestAxis): string => {
  const max = rest.duration.rangeMax;
  const range = max === undefined ? `${rest.duration.value}` : `${rest.duration.value}–${max}`;

  return `rest ${range}${rest.duration.unit.endsWith("min") ? MINUTE_MARK : " sec"}`;
};

export const buildAxesSummary = (container: ComposeContainer): string[] => {
  const parts: string[] = [];

  if (container.repetition !== undefined) {
    parts.push(repetitionLabel(container.repetition));
  }

  if (container.arrangement !== undefined && container.arrangement.kind !== "ordered") {
    parts.push(ARRANGEMENT_LABELS[container.arrangement.kind]);
  }

  if (container.scoring !== undefined) {
    parts.push(SCORING_LABELS[container.scoring.kind]);
  }

  if (container.rest !== undefined) {
    parts.push(restLabel(container.rest));
  }

  return parts;
};

export const formatAxesSummary = (container: ComposeContainer): string =>
  buildAxesSummary(container).join(DASH_SEPARATOR);
