import { type ArchetypeAssign } from "../parsers/mapping.js";

import {
  tryParseAlternatingSetsHeader,
  tryParseAmrapHeader,
  tryParseCompositeIntervalsHeader,
  tryParseCompositeRoundsRestHeader,
  tryParseEmomHeader,
  tryParseNRoundsHeader,
  tryParseNamedExerciseHeader,
  tryParseNamedThemedHeader,
  tryParseOnOffMaxTailHeader,
  tryParseRollingRoundsHeader,
  tryParseTimeWindowHeader,
  tryParseWorkRestFixedHeader,
  tryParseWorkRestProgressiveHeader,
} from "./parse-header.js";

const ARCHETYPE_HAS_HEADER: Record<string, boolean> = {
  "n-rounds": true,
  "named-themed-sets": true,
  "ladder-descending": true,
  "ladder-ascending": true,
  "ladder-vertex-down-pyramid": true,
  "ladder-spike": true,
  "amrap-flat": true,
  "emom-nested-per-minute": true,
  "time-window-outer": true,
  "composite-rounds-with-rest": true,
  "composite-intervals-then-rounds": true,
  "composite-intervals-work-rest-fixed": true,
  "composite-intervals-work-rest-progressive": true,
  "composite-intervals-on-off-max-tail": true,
  "composite-rolling-rounds": true,
  "nested-rounds-over-rounds": true,
  "nested-rounds-over-parallel-ladder": true,
  "nested-composite-rounds-over-ladder": true,
  "named-exercise-program": true,
  "alternating-sets": true,
  "emom-sub-minute-slot": true,
  // headerless archetypes
  "single-line-with-then-connector": false,
  "single-line-bare": false,
  "single-line-total-counter": false,
  "flat-list-headerless": false,
  "pull-ups-dips-cycle": false,
  "run-distance": false,
  "placeholder-body": false,
  "practice-list": false,
  "url-only-body": false,
  "parallel-ladders-descending": false,
  "parallel-ladders-mixed-direction": false,
  "parallel-pyramids": false,
  "super-set": false,
};

/** Detect whether a line is the header for a specific archetype. */
function lineMatchesArchetypeHeader(line: string, archetype: string): boolean {
  const trimmed = line.trim();

  if (trimmed === "") {
    return false;
  }

  switch (archetype) {
    case "n-rounds":
      return tryParseNRoundsHeader(trimmed) !== null;
    case "named-themed-sets":
      return tryParseNamedThemedHeader(trimmed) !== null;
    case "ladder-descending":
    case "ladder-ascending":
    case "ladder-vertex-down-pyramid":
    case "ladder-spike":
      return /^\d+(?:-\d+){1,}:\s*$/.test(trimmed);
    case "amrap-flat":
      return tryParseAmrapHeader(trimmed) !== null;
    case "emom-nested-per-minute":
      return tryParseEmomHeader(trimmed) !== null;
    case "time-window-outer":
      return tryParseTimeWindowHeader(trimmed) !== null;
    case "composite-rounds-with-rest":
      return tryParseCompositeRoundsRestHeader(trimmed) !== null;
    case "composite-intervals-then-rounds":
      return tryParseCompositeIntervalsHeader(trimmed) !== null;
    case "composite-intervals-work-rest-fixed":
      return tryParseWorkRestFixedHeader(trimmed) !== null;
    case "composite-intervals-work-rest-progressive":
      return tryParseWorkRestProgressiveHeader(trimmed) !== null;
    case "composite-intervals-on-off-max-tail":
      return tryParseOnOffMaxTailHeader(trimmed) !== null;
    case "composite-rolling-rounds":
      return tryParseRollingRoundsHeader(trimmed) !== null;
    case "nested-rounds-over-rounds":
    case "nested-rounds-over-parallel-ladder":
      return /^\d+\s+sets:\s*$/i.test(trimmed) || /^\d+\s+rounds:\s*$/i.test(trimmed);
    case "nested-composite-rounds-over-ladder":
      return /^\d+\s+sets?\s*\|.+rest.+:\s*$/i.test(trimmed);
    case "alternating-sets":
      return tryParseAlternatingSetsHeader(trimmed) !== null;
    case "named-exercise-program":
      return tryParseNamedExerciseHeader(trimmed) !== null;
    default:
      return false;
  }
}

/**
 * Split body lines into N chunks, one per top-level schema, using mapping
 * order. For headed archetypes we lock to the first matching header line;
 * for headerless archetypes we consume forward until the next chunk's start
 * is found (or end of body).
 */
export function chunkBody(body: string, mapping: ArchetypeAssign[]): string[][] {
  const lines = body.split("\n");
  const N = mapping.length;

  if (N === 0) {
    return [];
  }

  if (N === 1) {
    return [lines];
  }

  // Pre-scan: find candidate start lines for each schema (after the first).
  const startIdxs: number[] = [0];
  let cursor = 0;

  for (let i = 1; i < N; i++) {
    const nextArch = mapping[i]!.archetype;
    const expectsHeader = ARCHETYPE_HAS_HEADER[nextArch];

    let found = -1;

    if (expectsHeader) {
      for (let j = cursor + 1; j < lines.length; j++) {
        if (lineMatchesArchetypeHeader(lines[j]!, nextArch)) {
          found = j;
          break;
        }
      }
    } else {
      // Headerless: try to find the start by scanning ahead.
      // For each headerless archetype, look for its initial-line signature.
      for (let j = cursor + 1; j < lines.length; j++) {
        if (headerlessArchetypeStartsHere(lines[j]!, nextArch, lines, j)) {
          found = j;
          break;
        }
      }
    }

    if (found < 0) {
      // Fallback: greedy — split evenly
      const remaining = lines.length - cursor - 1;
      const step = Math.max(1, Math.floor(remaining / (N - i)));

      found = Math.min(lines.length - 1, cursor + 1 + step);
    }

    startIdxs.push(found);
    cursor = found;
  }

  const chunks: string[][] = [];

  for (let i = 0; i < N; i++) {
    const start = startIdxs[i]!;
    const end = i + 1 < N ? startIdxs[i + 1]! : lines.length;

    chunks.push(lines.slice(start, end));
  }

  return chunks;
}

function headerlessArchetypeStartsHere(
  line: string,
  archetype: string,
  lines: string[],
  idx: number,
): boolean {
  const trimmed = line.trim();

  if (trimmed === "") {
    return false;
  }

  switch (archetype) {
    case "parallel-ladders-descending":
    case "parallel-ladders-mixed-direction":
    case "parallel-pyramids":
      return /^\d+(?:-\d+){1,}\s*:?\s*$/.test(trimmed);
    case "single-line-with-then-connector": {
      // exercise row followed by `then`-style connector
      const next = lines[idx + 1]?.trim() ?? "";
      const next2 = lines[idx + 2]?.trim() ?? "";
      const isConnector =
        /^(then|\.\.\.then\.\.\.)\s*:?$/i.test(next) ||
        /^(then|\.\.\.then\.\.\.)\s*:?$/i.test(next2);

      return /\d+/.test(trimmed) && isConnector;
    }
    case "single-line-bare":
      // single exercise row, not part of a multi-row schema
      return /^\d+/.test(trimmed) && !/then/i.test(lines[idx + 1] ?? "");
    case "single-line-total-counter":
      return /\[\s*TOTAL\s*\]/i.test(trimmed);
    case "flat-list-headerless":
      return /^\d+/.test(trimmed) || /^[A-Za-z]/.test(trimmed);
    case "pull-ups-dips-cycle":
      return /strict pull-ups|traverses/.test(trimmed);
    case "run-distance":
      return /^(RUN|\d+(?:-\d+)?\s*km\s+run)/i.test(trimmed);
    case "placeholder-body":
      return /^(biceps|ANY exercise|\*\s*\S)/i.test(trimmed);
    case "practice-list":
      return /^\d+/.test(trimmed) || /^[A-Za-z]/.test(trimmed);
    case "url-only-body":
      return /^https?:\/\//.test(trimmed) || /^\[\s*https?:\/\//.test(trimmed);
    default:
      return false;
  }
}
