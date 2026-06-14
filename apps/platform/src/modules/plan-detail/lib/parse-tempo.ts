import type { FullTempo, TempoModifier } from "@repo/contracts/lms/_shared";

const TEMPO_TOKEN_COUNT = 4;
const TEMPO_MIN = 0;
const TEMPO_MAX = 60;
const TEMPO_HOLD = "X";
const TEMPO_SPLIT = /[-/\s]+/;
const DECIMAL_RADIX = 10;

type TempoPosition = FullTempo["eccentric"];

const parsePosition = (token: string): TempoPosition | null => {
  if (token === TEMPO_HOLD || token === "x") {
    return TEMPO_HOLD;
  }

  const parsed = Number.parseInt(token, DECIMAL_RADIX);

  if (!Number.isInteger(parsed) || String(parsed) !== token) {
    return null;
  }

  if (parsed < TEMPO_MIN || parsed > TEMPO_MAX) {
    return null;
  }

  return parsed;
};

export const parseTempo = (input: string): TempoModifier | null => {
  const trimmed = input.trim();

  if (trimmed === "") {
    return null;
  }

  const tokens = trimmed.split(TEMPO_SPLIT);

  if (tokens.length !== TEMPO_TOKEN_COUNT) {
    return trimmed;
  }

  const positions = tokens.map(parsePosition);

  const [eccentric, pauseBottom, concentric, pauseTop] = positions;

  if (
    eccentric === null ||
    eccentric === undefined ||
    pauseBottom === null ||
    pauseBottom === undefined ||
    concentric === null ||
    concentric === undefined ||
    pauseTop === null ||
    pauseTop === undefined
  ) {
    return trimmed;
  }

  return { eccentric, pauseBottom, concentric, pauseTop };
};
