import {
  DISTANCE_UNIT_LABELS,
  LADDER_DIRECTION_LABELS,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PAD_LENGTH = 2;
const SUMMARY_SEPARATOR = " • ";

const formatSec = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return `${minutes}:${seconds.toString().padStart(SECONDS_PAD_LENGTH, "0")}`;
};

const pluralize = (count: number, singular: string): string =>
  count === 1 ? singular : `${singular}s`;

export const formatSchemeSummary = (schemeType: SchemeType, params: SchemeParams): string => {
  const name = schemeType.name;

  switch (params.kind) {
    case "NONE":
      return name;
    case "COUNT_UP":
      return params.cap !== undefined
        ? `${name}${SUMMARY_SEPARATOR}cap ${formatSec(params.cap)}`
        : name;
    case "COUNT_DOWN":
      return `${name}${SUMMARY_SEPARATOR}${formatSec(params.durationSec)}`;
    case "INTERVAL_LOOP": {
      const slotCount = params.slots.length;

      return `${name}${SUMMARY_SEPARATOR}${params.sets} × ${slotCount} ${pluralize(slotCount, "slot")}`;
    }
    case "EMOM_LOOP": {
      const slotCount = params.slots.length;

      return `${name}${SUMMARY_SEPARATOR}${params.totalMinutes} min${SUMMARY_SEPARATOR}${slotCount} ${pluralize(slotCount, "slot")}`;
    }
    case "TIME_BOXED": {
      const segmentCount = params.segments.length;

      return `${name}${SUMMARY_SEPARATOR}${segmentCount} ${pluralize(segmentCount, "segment")}`;
    }
    case "LADDER":
      return `${name}${SUMMARY_SEPARATOR}${params.sequence.join("-")} (${LADDER_DIRECTION_LABELS[params.direction]})`;
    case "DISTANCE": {
      const unit = DISTANCE_UNIT_LABELS[params.unit];
      const range =
        params.distanceMax !== undefined
          ? `${params.distanceMin}-${params.distanceMax}`
          : `${params.distanceMin}`;

      return `${name}${SUMMARY_SEPARATOR}${range} ${unit}`;
    }
  }
};
