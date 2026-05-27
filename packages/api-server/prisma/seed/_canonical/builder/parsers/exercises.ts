import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type ExerciseCatalogEntry, type Equipment } from "../../canonical-schema.js";
import { exerciseCuid } from "../utils/cuid.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(
  __dirname,
  "../../../../../../../analysis/artifacts/03-content/exercise-canonical-list.md",
);

type MovementType = ExerciseCatalogEntry["movementTypeTagPrimary"];

const EQUIPMENT_MAP: Record<string, Equipment> = {
  bodyweight: "BODYWEIGHT",
  band: "BAND",
  dumbbell: "DUMBBELL",
  kettlebell: "KETTLEBELL",
  parallel_bars: "PARALLEL_BARS",
  rings: "RINGS",
  barbell: "BARBELL",
  mixed: "MIXED",
  box: "BOX",
  box_or_sofa: "BOX_OR_SOFA",
  sofa: "SOFA",
  unknown: "UNKNOWN",
};

const MOVEMENT_MAP: Record<string, MovementType> = {
  squat: "SQUAT",
  hinge: "HINGE",
  press: "PRESS",
  pull: "PULL",
  lunge: "LUNGE",
  carry: "CARRY",
  locomotion: "LOCOMOTION",
  static_hold: "STATIC_HOLD",
  rotational: "ROTATIONAL",
  cardio_flow: "CARDIO_FLOW",
  core: "CORE",
  combined_olympic: "COMBINED_OLYMPIC",
  raise: "RAISE",
  extension: "EXTENSION",
  unknown: "UNKNOWN",
};

type CCT = ExerciseCatalogEntry["canonicalCompoundType"];
const CCT_MAP: Record<string, CCT> = {
  atomic: "ATOMIC",
  compound_plus: "COMPOUND_PLUS",
  composite_named: "COMPOSITE_NAMED",
  alternative_or: "ALTERNATIVE_OR",
  placeholder: "PLACEHOLDER",
};

/**
 * Human-readable kebab-case slug. Used for LABEL refs (no cuid constraint
 * in contracts). EXERCISE refs use `exerciseCuid()` so the same identifier
 * passes `z.string().cuid()` everywhere the contracts schema requires it
 * (archetypeParams.exerciseId, ExerciseForm.atomic.exerciseId, etc.).
 */
export function kebabRef(name: string): string {
  const stripped = name
    .toLowerCase()
    .replace(/[*&|\\[\]()/'’]/g, " ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return stripped.length === 0 ? "x" : stripped.slice(0, 64);
}

function parseEquipment(raw: string): Equipment {
  const trimmed = raw.trim().toLowerCase();
  // Strip parenthesised qualifier: `mixed (band + dumbbell)` → `mixed`
  const head = trimmed.split("(")[0]!.trim().replace(/\s+/g, "_");
  const mapped = EQUIPMENT_MAP[head];

  if (mapped) {
    return mapped;
  }

  // Some entries say "dumbbell (slot)" / "bodyweight (slot)" — strip
  if (head === "dumbbell" || head === "bodyweight" || head === "kettlebell") {
    return EQUIPMENT_MAP[head]!;
  }

  return "UNKNOWN";
}

function parseMovementTags(raw: string): {
  primary: MovementType;
  secondary: MovementType | null;
} {
  const trimmed = raw.trim().toLowerCase();
  // forms: "pull", "squat / press", "hinge / lunge", "core / hinge"
  const parts = trimmed.split("/").map((p) => p.trim().replace(/\s+/g, "_"));
  const primaryRaw = parts[0] ?? "unknown";
  const primary = MOVEMENT_MAP[primaryRaw] ?? "UNKNOWN";

  if (parts.length === 1) {
    return { primary, secondary: null };
  }

  const secondaryRaw = parts[1] ?? "";
  const secondary = MOVEMENT_MAP[secondaryRaw] ?? null;

  return { primary, secondary };
}

function parseAliases(raw: string): string[] {
  // form: `[alias-1 (merged — ...), alias-2 (merged ...)]` OR `[ x ]`
  const trimmed = raw.trim();

  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [];
  }

  const inner = trimmed.slice(1, -1).trim();

  if (!inner) {
    return [];
  }

  // Split на top-level запятые (none of aliases have commas inside)
  return inner
    .split(",")
    .map((s) => s.trim())
    .map((s) => s.replace(/\s*\([^)]*merged[^)]*\)\s*$/i, "").trim())
    .filter((s) => s.length > 0);
}

function parseUrls(raw: string): string[] {
  const trimmed = raw.trim();

  if (trimmed === "none" || trimmed === "" || trimmed.startsWith("none ")) {
    return [];
  }

  // single URL or comma-separated list
  return trimmed
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
}

const HEADER_RE = /^### (.+)$/;
const FIELD_RE = /^- ([a-z_]+):\s*(.*)$/;

interface RawEntry {
  header: string;
  fields: Map<string, string>;
}

function parseRawEntries(text: string): RawEntry[] {
  const lines = text.split("\n");
  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\\\*/g, "*"); // strip md escape backslashes (\*)
    const hMatch = line.match(HEADER_RE);

    if (hMatch) {
      if (current) {
        entries.push(current);
      }

      current = { header: hMatch[1]!.trim(), fields: new Map() };
      continue;
    }

    if (!current) {
      continue;
    }

    const fMatch = line.match(FIELD_RE);

    if (fMatch) {
      current.fields.set(fMatch[1]!, fMatch[2]!);
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

export function parseExerciseCatalog(): ExerciseCatalogEntry[] {
  const text = readFileSync(CATALOG_PATH, "utf8");
  const raws = parseRawEntries(text);

  const entries: ExerciseCatalogEntry[] = [];
  const seenRefs = new Set<string>();

  for (const r of raws) {
    // Header that is a merge note like "bench presses → merged into DB bench presses (no separate entry)."
    if (r.header.includes("→ merged into")) {
      continue;
    }

    // Section headers (`§1. ...`, `§7. Coverage summary` etc.) won't have canonical_name field
    if (!r.fields.has("canonical_name")) {
      continue;
    }

    const canonicalName = r.fields.get("canonical_name") ?? r.header;
    const primaryEquipment = parseEquipment(r.fields.get("primary_equipment") ?? "unknown");
    const movements = parseMovementTags(r.fields.get("movement_type_tag") ?? "unknown");
    const compoundType =
      CCT_MAP[r.fields.get("canonical_compound_type")?.trim() ?? "atomic"] ?? "ATOMIC";
    const placeholderRaw = (r.fields.get("placeholder_flag") ?? "false").trim().toLowerCase();
    const placeholderFlag = placeholderRaw.startsWith("true") || placeholderRaw === "true";
    const aliases = parseAliases(r.fields.get("aliases") ?? "");
    const urls = parseUrls(r.fields.get("default_demo_url") ?? "");
    const notes = (r.fields.get("notes") ?? "").trim() || null;

    const ref = exerciseCuid(canonicalName);

    if (seenRefs.has(ref)) {
      throw new Error(`Exercise ref collision for ${canonicalName}`);
    }

    seenRefs.add(ref);

    entries.push({
      ref,
      canonicalName,
      primaryEquipment,
      movementTypeTagPrimary: movements.primary,
      movementTypeTagSecondary: movements.secondary,
      defaultDemoUrls: urls,
      canonicalCompoundType: compoundType,
      placeholderFlag,
      movementFamily: null,
      aliases,
      notes,
    });
  }

  if (entries.length !== 149) {
    throw new Error(`Expected 149 canonical exercises, parsed ${entries.length}`);
  }

  return entries;
}
