import { type RestSpec } from "@repo/contracts/lms/_shared";

const RANGE_MIN_RE = /^\s*-?\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*min\s+rest(.*)$/i;
const RANGE_SEC_RE = /^\s*-?\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*sec\s+rest(.*)$/i;
const FIXED_MIN_RE = /^\s*-?\s*(\d+(?:\.\d+)?)\s*min\s+(?:REST|rest)(.*)$/i;
const FIXED_SEC_RE = /^\s*-?\s*(\d+(?:\.\d+)?)\s*sec\s+(?:REST|rest)(.*)$/i;
const UNTIL_RECOVERY_RE = /(rest|REST)\s+(?:in\s+between\s+sets\s+)?until\s+recovery/i;

/**
 * Parse a body inline-rest marker line (already stripped of dashes /
 * surrounding markers). Returns RestSpec + a clean `raw` text.
 *
 * Heuristics:
 *  - `2 min rest in between rounds` → scope=between_rounds, fixed
 *  - `5 min rest in between sets`   → scope=between_sets, fixed
 *  - `rest UNTIL recovery`          → scope=between_sets, until_recovery (no duration?
 *                                      we default `value=1 min` and qualifier=until_recovery)
 *  - `90-120 sec rest`              → range_sec qualifier=range
 */
export function parseInlineRest(line: string): { raw: string; spec: RestSpec } | null {
  // strip leading/trailing dashes and whitespace
  const stripped = line.replace(/^[\s-]+|[\s-]+$/g, "").trim();

  if (!stripped) {
    return null;
  }

  const recoveryOnly =
    /^(rest|REST)\s+(in\s+between\s+sets\s+)?until\s+recovery$/i.test(stripped) ||
    /^rest\s+until\s+recovery$/i.test(stripped) ||
    /^REST\s+IN\s+BETWEEN\s+SETS\s+UNTIL\s+RECOVERY$/i.test(stripped) ||
    /^REST\s+UNTIL\s+RECOVERY$/i.test(stripped);

  if (recoveryOnly) {
    return {
      raw: line,
      spec: {
        duration: { value: 1, unit: "min" },
        scope: "between_sets",
        qualifier: "until_recovery",
      },
    };
  }

  const inferScope = (tail: string): RestSpec["scope"] => {
    const t = tail.toLowerCase();

    if (/between\s+rounds/.test(t)) {
      return "between_rounds";
    }

    if (/between\s+intervals/.test(t)) {
      return "between_intervals";
    }

    if (/after\s+\d+(?:st|nd|rd|th)?\s*set|after\s+set\s*\d+/.test(t)) {
      return "after_specific_set";
    }

    return "between_sets";
  };

  const inferSetIndex = (tail: string): number | undefined => {
    const m = tail.match(/after\s+(\d+)(?:st|nd|rd|th)?\s*set/i);

    if (m) {
      return parseInt(m[1]!, 10);
    }

    const m2 = tail.match(/after\s+set\s+(\d+)/i);

    if (m2) {
      return parseInt(m2[1]!, 10);
    }

    return undefined;
  };

  const rangeMin = stripped.match(RANGE_MIN_RE);

  if (rangeMin) {
    const tail = rangeMin[3] ?? "";
    const scope = inferScope(tail);
    const spec: RestSpec = {
      duration: {
        value: parseFloat(rangeMin[1]!),
        unit: "range_min",
        rangeMax: parseFloat(rangeMin[2]!),
      },
      scope,
      qualifier: "range",
    };
    const si = inferSetIndex(tail);

    if (si !== undefined) {
      spec.setIndex = si;
    }

    return { raw: line, spec };
  }

  const rangeSec = stripped.match(RANGE_SEC_RE);

  if (rangeSec) {
    const tail = rangeSec[3] ?? "";
    const scope = inferScope(tail);
    const spec: RestSpec = {
      duration: {
        value: parseFloat(rangeSec[1]!),
        unit: "range_sec",
        rangeMax: parseFloat(rangeSec[2]!),
      },
      scope,
      qualifier: "range",
    };
    const si = inferSetIndex(tail);

    if (si !== undefined) {
      spec.setIndex = si;
    }

    return { raw: line, spec };
  }

  const fixedMin = stripped.match(FIXED_MIN_RE);

  if (fixedMin) {
    const tail = fixedMin[2] ?? "";
    const scope = inferScope(tail);
    const spec: RestSpec = {
      duration: { value: parseFloat(fixedMin[1]!), unit: "min" },
      scope,
      qualifier: "fixed",
    };
    const si = inferSetIndex(tail);

    if (si !== undefined) {
      spec.setIndex = si;
    }

    return { raw: line, spec };
  }

  const fixedSec = stripped.match(FIXED_SEC_RE);

  if (fixedSec) {
    const tail = fixedSec[2] ?? "";
    const scope = inferScope(tail);
    const spec: RestSpec = {
      duration: { value: parseFloat(fixedSec[1]!), unit: "sec" },
      scope,
      qualifier: "fixed",
    };
    const si = inferSetIndex(tail);

    if (si !== undefined) {
      spec.setIndex = si;
    }

    return { raw: line, spec };
  }

  if (UNTIL_RECOVERY_RE.test(stripped)) {
    return {
      raw: line,
      spec: {
        duration: { value: 1, unit: "min" },
        scope: "between_sets",
        qualifier: "until_recovery",
      },
    };
  }

  return null;
}
