import { type TempoModifier } from "@repo/contracts/lms/_shared";

const TEMPO_SEPARATOR = "-";

const digit = (value: number | "X"): string => String(value);

export const formatTempo = (tempo: TempoModifier): string =>
  typeof tempo === "string"
    ? tempo
    : `${digit(tempo.eccentric)}${TEMPO_SEPARATOR}${digit(tempo.pauseBottom)}${TEMPO_SEPARATOR}${digit(tempo.concentric)}${TEMPO_SEPARATOR}${digit(tempo.pauseTop)}`;
