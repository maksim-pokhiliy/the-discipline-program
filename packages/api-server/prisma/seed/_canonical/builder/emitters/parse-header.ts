import { type RestSpec } from "@repo/contracts/lms/_shared";

import { parseInlineRest } from "../extractors/restspec.js";

export interface NRoundsHeader {
  countForm: "exact" | "range" | "count_times_reps";
  count?: number;
  countRange?: { min: number; max: number };
  repsPerSet?: number;
  rest?: RestSpec;
}

/**
 * Try parsing an n-rounds-family header:
 *  `3 rounds:`, `3-5 rounds:`, `3 sets:`, `3-4 sets:`, `5 sets:`, `1 set:`,
 *  `3x 10 reps:`, `3 sets | 2 min rest in between sets:`,
 *  `4 rounds | 2 min REST after each round:`
 */
export function tryParseNRoundsHeader(header: string): NRoundsHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();

  if (!trimmed) {
    return null;
  }

  const [mainPart, ...modParts] = trimmed.split("|").map((s) => s.trim());
  const main = (mainPart ?? "").trim();

  let result: NRoundsHeader | null = null;

  const ctR = main.match(/^(\d+)x\s*(\d+)\s+reps?$/i);

  if (ctR) {
    result = {
      countForm: "count_times_reps",
      count: parseInt(ctR[1]!, 10),
      repsPerSet: parseInt(ctR[2]!, 10),
    };
  }

  const range = main.match(/^(\d+)\s*-\s*(\d+)\s+(rounds?|sets?|INTERVALS?)$/i);

  if (range && !result) {
    result = {
      countForm: "range",
      countRange: { min: parseInt(range[1]!, 10), max: parseInt(range[2]!, 10) },
    };
  }

  const exact = main.match(/^(\d+)\s+(rounds?|sets?|INTERVALS?)$/i);

  if (exact && !result) {
    result = {
      countForm: "exact",
      count: parseInt(exact[1]!, 10),
    };
  }

  if (!result) {
    return null;
  }

  for (const m of modParts) {
    const rest = parseInlineRest(m);

    if (rest) {
      result.rest = rest.spec;
    }
  }

  return result;
}

const LADDER_HEADER_RE = /^([\d-]+):?\s*$/;

export function tryParseLadderSteps(header: string): number[] | null {
  const trimmed = header.trim();
  const m = trimmed.match(LADDER_HEADER_RE);

  if (!m) {
    return null;
  }

  const steps = m[1]!.split("-").map((s) => parseInt(s, 10));

  if (steps.some((s) => isNaN(s) || s <= 0)) {
    return null;
  }

  if (steps.length < 1) {
    return null;
  }

  return steps;
}

export function classifyLadderDirection(
  steps: number[],
): "descending" | "ascending" | "vertex-down-pyramid" | "spike" | "mixed" {
  if (steps.length < 2) {
    return "descending";
  }

  const allDesc = steps.every((s, i) => i === 0 || s < steps[i - 1]!);

  if (allDesc) {
    return "descending";
  }

  const allAsc = steps.every((s, i) => i === 0 || s > steps[i - 1]!);

  if (allAsc) {
    return "ascending";
  }

  // Pyramid: ascending then descending (3-6-9-12-9-6-3) OR descending then ascending (11-9-7-9-11)
  // Vertex-down: V-shape (11-9-7-9-11) — descending then ascending
  let peakIdx = 0;

  for (let i = 1; i < steps.length; i++) {
    if (steps[i]! > steps[peakIdx]!) {
      peakIdx = i;
    }
  }

  if (peakIdx > 0 && peakIdx < steps.length - 1) {
    const goesUp = steps[peakIdx]! > steps[0]!;

    if (goesUp) {
      return "vertex-down-pyramid";
    }
  }

  // Spike: ascending then descending bump (10-8-6-4-10) — endpoint sticks out
  if (steps[steps.length - 1]! >= steps[0]!) {
    return "spike";
  }

  return "mixed";
}

export interface NamedThemedHeader {
  count: number | { min: number; max: number };
  theme: string;
}

export function tryParseNamedThemedHeader(header: string): NamedThemedHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const parts = trimmed.split("|").map((s) => s.trim());

  if (parts.length < 2) {
    return null;
  }

  const countPart = parts[0]!;
  const themePart = parts.slice(1).join(" | ");
  const countMatch =
    countPart.match(/^(\d+)\s+sets?$/i) ?? countPart.match(/^(\d+)\s*-\s*(\d+)\s+sets?$/i);

  if (!countMatch) {
    return null;
  }

  const count = countMatch[2]
    ? { min: parseInt(countMatch[1]!, 10), max: parseInt(countMatch[2], 10) }
    : parseInt(countMatch[1]!, 10);

  return { count, theme: themePart };
}

export interface TimeWindowHeader {
  startHhMm: string;
  endHhMm: string;
}

export function tryParseTimeWindowHeader(header: string): TimeWindowHeader | null {
  const m = header.trim().match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+min:?$/);

  if (!m) {
    return null;
  }

  return { startHhMm: m[1]!, endHhMm: m[2]! };
}

export interface AmrapHeader {
  durationMin: number;
}

export function tryParseAmrapHeader(header: string): AmrapHeader | null {
  const m = header.trim().match(/^AMRAP\s+(\d+)\s+min:?$/i);

  if (!m) {
    return null;
  }

  return { durationMin: parseInt(m[1]!, 10) };
}

export interface EmomHeader {
  durationMin: number;
  rounds?: number;
}

export function tryParseEmomHeader(header: string): EmomHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const parts = trimmed.split("|").map((s) => s.trim());
  const main = parts[0] ?? "";
  const m = main.match(/^EMOM\s+(\d+)\s+min$/i);

  if (!m) {
    return null;
  }

  const result: EmomHeader = { durationMin: parseInt(m[1]!, 10) };

  for (const p of parts.slice(1)) {
    const r = p.match(/^(\d+)\s+rounds?$/i);

    if (r) {
      result.rounds = parseInt(r[1]!, 10);
    }
  }

  return result;
}

export interface EmomSlotHeader {
  kind: "single" | "grouped";
  minutes: number[];
}

export function tryParseEmomSlotHeader(header: string): EmomSlotHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  // grouped: `1st & 2nd min` / `3 & 4 min` / `1 & 2 min`
  const grouped = trimmed.match(/^(\d+)(?:st|nd|rd|th)?\s*&\s*(\d+)(?:st|nd|rd|th)?\s+min$/i);

  if (grouped) {
    return {
      kind: "grouped",
      minutes: [parseInt(grouped[1]!, 10), parseInt(grouped[2]!, 10)],
    };
  }

  // single: `1 min`, `2 min`
  const single = trimmed.match(/^(\d+)(?:st|nd|rd|th)?\s+min$/i);

  if (single) {
    return { kind: "single", minutes: [parseInt(single[1]!, 10)] };
  }

  return null;
}

export interface CompositeRoundsRestHeader {
  count: number | { min: number; max: number };
  rest: RestSpec;
}

export function tryParseCompositeRoundsRestHeader(
  header: string,
): CompositeRoundsRestHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const parts = trimmed.split("|").map((s) => s.trim());

  if (parts.length < 2) {
    return null;
  }

  const main = parts[0]!;
  const countMatch =
    main.match(/^(\d+)\s+(rounds?|sets?)$/i) ??
    main.match(/^(\d+)\s*-\s*(\d+)\s+(rounds?|sets?)$/i);

  if (!countMatch) {
    return null;
  }

  const count = countMatch[3]
    ? { min: parseInt(countMatch[1]!, 10), max: parseInt(countMatch[2]!, 10) }
    : parseInt(countMatch[1]!, 10);
  // Find rest spec in any modifier
  let rest: RestSpec | null = null;

  for (const p of parts.slice(1)) {
    const r = parseInlineRest(p);

    if (r) {
      rest = r.spec;
      break;
    }
  }

  if (!rest) {
    return null;
  }

  return { count, rest };
}

export interface CompositeIntervalsHeader {
  intervalsCount: number;
  restMin: number;
}

export function tryParseCompositeIntervalsHeader(header: string): CompositeIntervalsHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const parts = trimmed.split("|").map((s) => s.trim());
  const main = parts[0] ?? "";
  const m = main.match(/^(\d+)\s+INTERVALS?$/i);

  if (!m) {
    return null;
  }

  let restMin = 0;

  for (const p of parts.slice(1)) {
    const r = p.match(/^(\d+(?:\.\d+)?)\s*min\s+rest\s+in\s+between(?:\s+rounds|sets)?$/i);

    if (r) {
      restMin = parseFloat(r[1]!);
    }
  }

  return { intervalsCount: parseInt(m[1]!, 10), restMin };
}

export interface WorkRestFixedHeader {
  intervalsCount: number;
  workMin: number;
  restMin: number;
}

export function tryParseWorkRestFixedHeader(header: string): WorkRestFixedHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const m = trimmed.match(
    /^(\d+)x\s*(\d+(?:\.\d+)?)\s+min\s+WORK\s*\|\s*(\d+(?:\.\d+)?)\s+min\s+REST/i,
  );

  if (!m) {
    return null;
  }

  return {
    intervalsCount: parseInt(m[1]!, 10),
    workMin: parseFloat(m[2]!),
    restMin: parseFloat(m[3]!),
  };
}

export interface WorkRestProgressiveHeader {
  sets: number;
  workMin: number;
  offMin: number;
}

export function tryParseWorkRestProgressiveHeader(
  header: string,
): WorkRestProgressiveHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const m = trimmed.match(
    /^(\d+)\s+sets?\s*\|\s*(\d+(?:\.\d+)?)\s+min\s+WORK\s*\|\s*(\d+(?:\.\d+)?)\s+min\s+OFF/i,
  );

  if (!m) {
    return null;
  }

  return {
    sets: parseInt(m[1]!, 10),
    workMin: parseFloat(m[2]!),
    offMin: parseFloat(m[3]!),
  };
}

export interface OnOffMaxTailHeader {
  intervals: number;
  onMin: number;
  offMin: number;
}

export function tryParseOnOffMaxTailHeader(header: string): OnOffMaxTailHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const m = trimmed.match(
    /^(\d+)x\s*(\d+(?:\.\d+)?)\s+min\s+ON\s*\|\s*(\d+(?:\.\d+)?)\s+min\s+OFF/i,
  );

  if (!m) {
    return null;
  }

  return {
    intervals: parseInt(m[1]!, 10),
    onMin: parseFloat(m[2]!),
    offMin: parseFloat(m[3]!),
  };
}

export interface RollingRoundsHeader {
  everyNthMin: number;
  rounds: number;
  totalMin: number;
}

export function tryParseRollingRoundsHeader(header: string): RollingRoundsHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  const m = trimmed.match(
    /^Every\s+(\d+)(?:st|nd|rd|th)?\s+min\s+new\s+round\s*\|\s*x?(\d+)\s+rounds?\s*\|\s*(\d+)\s+min/i,
  );

  if (!m) {
    return null;
  }

  return {
    everyNthMin: parseInt(m[1]!, 10),
    rounds: parseInt(m[2]!, 10),
    totalMin: parseInt(m[3]!, 10),
  };
}

export interface AlternatingSetsHeader {
  setEnumeration: number[];
}

export function tryParseAlternatingSetsHeader(header: string): AlternatingSetsHeader | null {
  const trimmed = header.trim().replace(/:$/, "").trim();
  // form: `1st | 3rd | 5th sets` / `2nd | 4th | 6th sets`
  const parts = trimmed.split("|").map((s) => s.trim());

  if (parts.length < 2) {
    return null;
  }

  const last = parts[parts.length - 1]!.replace(/\s+sets?$/i, "").trim();
  const allButLast = parts.slice(0, -1);
  const setNumbers: number[] = [];

  for (const p of allButLast) {
    const num = p.match(/^(\d+)(?:st|nd|rd|th)$/);

    if (!num) {
      return null;
    }

    setNumbers.push(parseInt(num[1]!, 10));
  }
  const lastNum = last.match(/^(\d+)(?:st|nd|rd|th)?$/);

  if (!lastNum) {
    return null;
  }

  setNumbers.push(parseInt(lastNum[1]!, 10));

  return { setEnumeration: setNumbers };
}

export interface NamedExerciseHeader {
  exerciseText: string;
}

export function tryParseNamedExerciseHeader(header: string): NamedExerciseHeader | null {
  const raw = header.trim();

  if (!raw.endsWith(":")) {
    return null;
  } // header must terminate with colon

  const trimmed = raw.replace(/:$/, "").trim();

  if (!trimmed) {
    return null;
  }

  // Reject if matches a structural pattern (those have their own dedicated matchers)
  if (/^\d/.test(trimmed)) {
    return null;
  }

  if (/^EMOM/i.test(trimmed)) {
    return null;
  }

  if (/^AMRAP/i.test(trimmed)) {
    return null;
  }

  if (/^Every\s+\d+/i.test(trimmed)) {
    return null;
  }

  if (/^[A-Za-z]+\s*\|/.test(trimmed)) {
    return null;
  } // composite headers (1st | 3rd | 5th sets)

  if (/\bsets?\b/i.test(trimmed) && /^\d/.test(trimmed)) {
    return null;
  }

  return { exerciseText: trimmed };
}
