import type { TempoModifier } from "@repo/contracts/lms/_shared";

const TEMPO_TOKEN_COUNT = 4;
const TEMPO_MIN = 0;
const TEMPO_MAX = 60;
const TEMPO_HOLD = "X";
const TEMPO_SPLIT = /[-/\s]+/;
const DECIMAL_RADIX = 10;

const TEMPO_ERROR = "Tempo must be 4 positions, each 0–60 or X, e.g. 3-1-X-0";

type TempoPosition = TempoModifier["eccentric"];

export type ParseTempoResult =
  | { ok: true; value: TempoModifier | null }
  | { ok: false; error: string };

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

export const parseTempo = (input: string): ParseTempoResult => {
  const trimmed = input.trim();

  if (trimmed === "") {
    return { ok: true, value: null };
  }

  const tokens = trimmed.split(TEMPO_SPLIT);

  if (tokens.length !== TEMPO_TOKEN_COUNT) {
    return { ok: false, error: TEMPO_ERROR };
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
    return { ok: false, error: TEMPO_ERROR };
  }

  return { ok: true, value: { eccentric, pauseBottom, concentric, pauseTop } };
};
