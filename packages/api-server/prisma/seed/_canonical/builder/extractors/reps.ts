import { type RepNotation } from "@repo/contracts/lms/_shared";

export interface ParsedLead {
  reps: RepNotation;
  exerciseText: string;
  /** When source `RUN 5 km` keeps modality token in body, we surface it for run-distance. */
  modality?: "RUN";
}

const COUNT_RE = /^(\d+)\s+(.*)$/;
const RANGE_RE = /^(\d+)\s*-\s*(\d+)\s+(.*)$/;
const KM_VALUE_RE = /^(\d+(?:\.\d+)?)\s+km\s+(.*)$/i;
const KM_RANGE_RE = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s+km\s+(.*)$/i;
const RUN_KM_VALUE_RE = /^RUN\s+(\d+(?:\.\d+)?)\s+km$/i;
const RUN_KM_RANGE_RE = /^RUN\s+(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s+km$/i;
const RUN_BARE_RE = /^RUN$/i;
const MIN_VALUE_RE = /^(\d+(?:\.\d+)?)\s+min\s+(.*)$/i;
const SEC_VALUE_RE = /^(\d+(?:\.\d+)?)\s+sec\s+(.*)$/i;
const MAX_REM_TIME_RE = /^MAX\s+(.+?)\s+in\s+remaining\s+time$/i;
const MAX_ROUNDS_REM_RE = /^MAX\s+ROUNDS\s+in\s+remaining\s+time:?\s*(.*)$/i;
const MAX_BARE_RE = /^MAX\s+(.+)$/i;

/** Try to peel a leading rep notation off the exercise line. */
export function parseRepLead(text: string): ParsedLead {
  const trimmed = text.trim();

  const runRange = trimmed.match(RUN_KM_RANGE_RE);

  if (runRange) {
    return {
      reps: {
        kind: "unit_bound",
        unit: "km",
        range: { min: parseFloat(runRange[1]!), max: parseFloat(runRange[2]!) },
      },
      exerciseText: "RUN",
      modality: "RUN",
    };
  }

  const runValue = trimmed.match(RUN_KM_VALUE_RE);

  if (runValue) {
    return {
      reps: { kind: "unit_bound", unit: "km", value: parseFloat(runValue[1]!) },
      exerciseText: "RUN",
      modality: "RUN",
    };
  }

  if (RUN_BARE_RE.test(trimmed)) {
    return { reps: { kind: "implicit" }, exerciseText: "RUN", modality: "RUN" };
  }

  const kmRange = trimmed.match(KM_RANGE_RE);

  if (kmRange) {
    return {
      reps: {
        kind: "unit_bound",
        unit: "km",
        range: { min: parseFloat(kmRange[1]!), max: parseFloat(kmRange[2]!) },
      },
      exerciseText: kmRange[3]!.trim(),
      modality: "RUN",
    };
  }

  const kmValue = trimmed.match(KM_VALUE_RE);

  if (kmValue) {
    return {
      reps: { kind: "unit_bound", unit: "km", value: parseFloat(kmValue[1]!) },
      exerciseText: kmValue[2]!.trim(),
      modality: "RUN",
    };
  }

  const minMatch = trimmed.match(MIN_VALUE_RE);

  if (minMatch) {
    return {
      reps: { kind: "unit_bound", unit: "min", value: parseFloat(minMatch[1]!) },
      exerciseText: minMatch[2]!.trim(),
    };
  }

  const secMatch = trimmed.match(SEC_VALUE_RE);

  if (secMatch) {
    return {
      reps: { kind: "unit_bound", unit: "sec", value: parseFloat(secMatch[1]!) },
      exerciseText: secMatch[2]!.trim(),
    };
  }

  const remTime = trimmed.match(MAX_REM_TIME_RE);

  if (remTime) {
    return {
      reps: { kind: "max", subForm: "in_remaining_time" },
      exerciseText: remTime[1]!.trim(),
    };
  }

  const maxRounds = trimmed.match(MAX_ROUNDS_REM_RE);

  if (maxRounds) {
    const seed = maxRounds[1]!.trim();

    return {
      reps: { kind: "max", subForm: "progressive", progressiveSeed: seed || "1-2-3 etc." },
      exerciseText: "MAX ROUNDS",
    };
  }

  const maxBare = trimmed.match(MAX_BARE_RE);

  if (maxBare) {
    return {
      reps: { kind: "max", subForm: "bare" },
      exerciseText: maxBare[1]!.trim(),
    };
  }

  const range = trimmed.match(RANGE_RE);

  if (range) {
    const min = parseInt(range[1]!, 10);
    const max = parseInt(range[2]!, 10);

    if (max > min) {
      return {
        reps: { kind: "range", min, max },
        exerciseText: range[3]!.trim(),
      };
    }
  }

  const count = trimmed.match(COUNT_RE);

  if (count) {
    return {
      reps: { kind: "count", value: parseInt(count[1]!, 10) },
      exerciseText: count[2]!.trim(),
    };
  }

  return { reps: { kind: "implicit" }, exerciseText: trimmed };
}
