import { type LabelCatalogEntry } from "../../canonical-schema.js";

import { kebabRef } from "./exercises.js";
import { type BlockInventoryEntry } from "./inventory.js";

export interface DecomposedLabel {
  /** Catalog refs in order. Empty array when block-label is `(implicit)`. */
  labelRefs: string[];
  /** Optional effort percent extracted from `[ N% EFFORT ]` / `[ N-M% Effort ]`. */
  intensityEffortPercent: { value: number } | { range: { min: number; max: number } } | null;
  /** Optional pace extracted (Phase 5: EASY PACE remains as label, NOT intensity per Q8 amendment from labels-catalog.md §3.3 — kept null here; pace label is added as separate ref.) */
  intensityPace: null;
  /** Optional timeCap extracted from `[ N min ]` / `[ N-M min ]` / `[ N sec ]`. */
  timeCap: { min: number; max?: number; unit: "min" | "sec" } | null;
  /** Optional schema-header injection per Rule 2 (`3 sets`-prefix labels). */
  schemaHeaderPrefix: string | null;
  /** Names actually used (canonical form) for catalog registration. */
  registerNames: { name: string; ref: string }[];
}

const PHASE_7_LABELS = ["ENDURANCE", "CONDITIONING", "STRENGTH", "OLYMPIC", "ACCESSORY"] as const;

export const REST_DAY_LABEL = { name: "REST DAY", ref: "rest-day" };
export const SESSION_LABEL = { name: "1ST SESSION", ref: "1st-session" };

const BRACKET_RE = /\[([^\]]+)\]/g;
const EFFORT_RE = /^\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*%\s*effort\s*$/i;
const TIMECAP_RE = /^\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*(min|sec)\s*$/i;
const SCHEMA_HEADER_RE = /(\d+)(?:\s*-\s*(\d+))?\s+(sets|rounds)/i;

function refOf(name: string): string {
  return kebabRef(name);
}

export function decomposeLabel(rawLabel: string): DecomposedLabel {
  if (rawLabel === "(implicit)") {
    return {
      labelRefs: [],
      intensityEffortPercent: null,
      intensityPace: null,
      timeCap: null,
      schemaHeaderPrefix: null,
      registerNames: [],
    };
  }

  let remaining = rawLabel;
  let effortPercent: DecomposedLabel["intensityEffortPercent"] = null;
  let timeCap: DecomposedLabel["timeCap"] = null;

  // Rule 1: bracket extraction
  const brackets: { full: string; inner: string }[] = [];

  for (const m of remaining.matchAll(BRACKET_RE)) {
    brackets.push({ full: m[0]!, inner: m[1]!.trim() });
  }
  for (const b of brackets) {
    const effortMatch = b.inner.match(EFFORT_RE);

    if (effortMatch) {
      if (effortMatch[2]) {
        effortPercent = {
          range: { min: parseInt(effortMatch[1]!, 10), max: parseInt(effortMatch[2], 10) },
        };
      } else {
        effortPercent = { value: parseInt(effortMatch[1]!, 10) };
      }

      remaining = remaining.replace(b.full, "");
      continue;
    }

    const timeMatch = b.inner.match(TIMECAP_RE);

    if (timeMatch) {
      const unit = timeMatch[3]!.toLowerCase() as "min" | "sec";

      timeCap = timeMatch[2]
        ? { min: parseInt(timeMatch[1]!, 10), max: parseInt(timeMatch[2], 10), unit }
        : { min: parseInt(timeMatch[1]!, 10), unit };
      remaining = remaining.replace(b.full, "");
      continue;
    }
  }

  remaining = remaining.replace(/\s+/g, " ").trim();

  // Rule 2: schema-header extraction
  let schemaHeaderPrefix: string | null = null;
  const hMatch = remaining.match(SCHEMA_HEADER_RE);

  if (hMatch) {
    const num = hMatch[2] ? `${hMatch[1]}-${hMatch[2]}` : hMatch[1]!;
    const word = hMatch[3]!.toLowerCase();

    schemaHeaderPrefix = `${num} ${word}:`;
    remaining = remaining.replace(hMatch[0]!, "").replace(/\s+/g, " ").trim();
    // strip orphan separators
    remaining = remaining
      .replace(/^\|+\s*/, "")
      .replace(/\s*\|+$/, "")
      .trim();
  }

  // Rule 3: split on |
  const parts = remaining
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const registerNames = parts.map((name) => ({ name, ref: refOf(name) }));

  return {
    labelRefs: registerNames.map((r) => r.ref),
    intensityEffortPercent: effortPercent,
    intensityPace: null,
    timeCap,
    schemaHeaderPrefix,
    registerNames,
  };
}

export function buildLabelCatalog(
  inventory: Map<string, BlockInventoryEntry>,
): LabelCatalogEntry[] {
  // ref → entry (latest write wins for casing — irrelevant since we dedupe by ref)
  const map = new Map<string, LabelCatalogEntry>();

  function ensure(entry: LabelCatalogEntry) {
    const existing = map.get(entry.ref);

    if (!existing) {
      map.set(entry.ref, entry);

      return;
    }

    // merge applicableLevels (union, preserving order day < session < block)
    const merged = new Set([...existing.applicableLevels, ...entry.applicableLevels]);

    existing.applicableLevels = (["DAY", "SESSION", "BLOCK"] as const).filter((lvl) =>
      merged.has(lvl),
    );

    if (entry.rest) {
      existing.rest = true;
    }
  }

  ensure({
    ref: REST_DAY_LABEL.ref,
    name: REST_DAY_LABEL.name,
    applicableLevels: ["DAY"],
    rest: true,
    notes: null,
  });
  ensure({
    ref: SESSION_LABEL.ref,
    name: SESSION_LABEL.name,
    applicableLevels: ["SESSION"],
    rest: false,
    notes: null,
  });

  for (const b of inventory.values()) {
    const decomp = decomposeLabel(b.label);

    for (const reg of decomp.registerNames) {
      ensure({
        ref: reg.ref,
        name: reg.name,
        applicableLevels: ["BLOCK"],
        rest: false,
        notes: null,
      });
    }
  }

  for (const phase7Name of PHASE_7_LABELS) {
    ensure({
      ref: refOf(phase7Name),
      name: phase7Name,
      applicableLevels: ["BLOCK"],
      rest: false,
      notes: null,
    });
  }

  return Array.from(map.values());
}
