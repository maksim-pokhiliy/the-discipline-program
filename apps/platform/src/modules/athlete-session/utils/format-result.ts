import { type Result } from "@repo/contracts/lms/_shared";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PAD_LENGTH = 2;
const SECONDS_PAD_CHAR = "0";

const ROUNDS_LABEL = "rounds";
const REPS_LABEL = "reps";
const ROUNDS_REPS_JOIN = " + ";
const KG_LABEL = "kg";
const MAX_REPS_LABEL = "reps";
const CALORIES_LABEL = "cal";
const VALUE_UNIT_JOIN = " ";

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.round(seconds);
  const minutes = Math.floor(wholeSeconds / SECONDS_PER_MINUTE);
  const remainder = wholeSeconds % SECONDS_PER_MINUTE;

  return `${minutes}:${String(remainder).padStart(SECONDS_PAD_LENGTH, SECONDS_PAD_CHAR)}`;
};

export const formatResult = (result: Result): string => {
  switch (result.type) {
    case "time":
      return formatTime(result.seconds);
    case "rounds_reps":
      return `${result.rounds} ${ROUNDS_LABEL}${ROUNDS_REPS_JOIN}${result.reps} ${REPS_LABEL}`;
    case "load":
      return `${result.kg} ${KG_LABEL}`;
    case "max_reps":
      return `${result.reps} ${MAX_REPS_LABEL}`;
    case "distance":
      return `${result.value}${VALUE_UNIT_JOIN}${result.unit}`;
    case "calories":
      return `${result.value} ${CALORIES_LABEL}`;
    default:
      result satisfies never;

      return "";
  }
};
