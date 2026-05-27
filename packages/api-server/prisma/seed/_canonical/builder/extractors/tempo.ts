import { type TempoModifier } from "@repo/contracts/lms/_shared";

const PAUSE_IN_UP_RE = /^\+?\s*(\d+(?:\.\d+)?)\s*sec\s+pause\s+in\s+UP(?:\s+position)?$/i;
const PER_NTH_REP_RE =
  /^AFTER\s+each\s+(\d+)\s*(?:st|nd|rd|th)\s+REP\s*-\s*(\d+(?:\.\d+)?)\s*sec\s+pause$/i;
const SLOW_DOWN_RE = /^(\d+(?:\.\d+)?)\s*sec\s+SLOW\s+down$/i;
const HOLD_LAST_RE = /^(\d+(?:\.\d+)?)\s*sec\s+HOLD\s+after\s+LAST$/i;

export function tryParseTempo(inner: string): TempoModifier | null {
  const txt = inner.trim();

  const pauseUp = txt.match(PAUSE_IN_UP_RE);

  if (pauseUp) {
    return {
      pauseInUp: { durationSec: parseFloat(pauseUp[1]!), position: "up" },
    };
  }

  const perN = txt.match(PER_NTH_REP_RE);

  if (perN) {
    return {
      perNthRepPause: {
        everyN: parseInt(perN[1]!, 10),
        pauseSec: parseFloat(perN[2]!),
      },
    };
  }

  const slow = txt.match(SLOW_DOWN_RE);

  if (slow) {
    return { slowEccentric: { durationSec: parseFloat(slow[1]!) } };
  }

  const hold = txt.match(HOLD_LAST_RE);

  if (hold) {
    return { holdAfterLast: { durationSec: parseFloat(hold[1]!) } };
  }

  return null;
}
