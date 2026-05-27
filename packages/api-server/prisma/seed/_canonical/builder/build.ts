import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type CanonicalDay,
  type CanonicalSeed,
  type CanonicalSession,
  type CanonicalWeek,
} from "../canonical-schema.js";

import { emitBlock } from "./emitters/emit-block.js";
import { buildPhase7Sessions, ensurePhase7Catalog } from "./emitters/phase7.js";
import { parseExerciseCatalog } from "./parsers/exercises.js";
import { parseInventory } from "./parsers/inventory.js";
import { buildLabelCatalog, REST_DAY_LABEL, SESSION_LABEL } from "./parsers/labels.js";
import { parseArchetypeMapping } from "./parsers/mapping.js";
import { buildSheetLayouts } from "./parsers/sheets.js";
import { ExerciseResolver } from "./utils/exercise-resolver.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../plan-denys.json");

const TOTAL_WEEKS = 33;
const TODAY_WEEK_INDEX = 16; // weeks[15] is the "today" week (0-indexed)

function gitShortSha(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function buildWeek(
  weekIndex: number,
  sheetRef: string,
  days: ReturnType<typeof buildSheetLayouts>[number]["days"],
  resolver: ExerciseResolver,
  inventory: Map<
    string,
    ReturnType<typeof parseInventory> extends Map<string, infer V> ? V : never
  >,
  mapping: Map<
    string,
    ReturnType<typeof parseArchetypeMapping> extends Map<string, infer V> ? V : never
  >,
): CanonicalWeek {
  const dayEntries: CanonicalDay[] = days.map((d) => {
    if (d.isRest) {
      return {
        dayOfWeek: d.dayOfWeek,
        label: REST_DAY_LABEL.ref,
        notes: null,
        sessions: [],
      };
    }

    const sessions: CanonicalSession[] = d.sessions.map((s) => ({
      order: s.order,
      label: SESSION_LABEL.ref,
      notes: null,
      freezeLoadsAtCreation: false,
      blocks: s.blocks.map((b, idx) => {
        const inv = inventory.get(b.blockRef)!;
        const mp = mapping.get(b.blockRef)!;

        return emitBlock(inv, mp, (idx + 1) * 10, { resolver });
      }),
    }));

    return {
      dayOfWeek: d.dayOfWeek,
      label: null,
      notes: null,
      sessions,
    };
  });

  return {
    weekIndex,
    sheetRef,
    weekOffsetFromTodayWeeks: -(TODAY_WEEK_INDEX - 1) + (weekIndex - 1),
    notes: null,
    days: dayEntries,
  };
}

export function buildCanonicalSeed(): CanonicalSeed {
  const inventory = parseInventory();
  const mapping = parseArchetypeMapping();
  const initialCatalog = parseExerciseCatalog();
  const resolver = new ExerciseResolver(initialCatalog);

  ensurePhase7Catalog(resolver.catalog());

  const labels = buildLabelCatalog(inventory);
  const sheetLayouts = buildSheetLayouts(inventory);

  const weeks: CanonicalWeek[] = sheetLayouts.map((layout) =>
    buildWeek(layout.weekIndex, layout.sheetRef, layout.days, resolver, inventory, mapping),
  );

  const phase7 = buildPhase7Sessions(resolver);

  const sha = gitShortSha();
  const unmatchedCount = resolver.unmatchedReports.length;
  const notes = buildMetaNotes(unmatchedCount, resolver.unmatchedReports);

  const seed: CanonicalSeed = {
    meta: {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      sourceRepoCommit: sha,
      sourceSheetsRange: { fromSheet: "sheet-01", toSheet: "sheet-33" },
      notes,
    },
    catalog: {
      exercises: resolver.catalog(),
      labels,
    },
    plan: {
      title: "Maks Pooh — Discipline 2025–2026",
      description: null,
      athleteName: "Maks Pooh",
      totalWeeks: TOTAL_WEEKS,
      todayWeekIndex: TODAY_WEEK_INDEX,
    },
    weeks,
    phase7Examples: phase7.map((s) => ({
      exampleId: s.exampleId,
      dayOfWeek: s.dayOfWeek,
      order: s.order,
      label: s.label,
      notes: s.notes,
      freezeLoadsAtCreation: s.freezeLoadsAtCreation,
      blocks: s.blocks,
    })),
  };

  return seed;
}

function buildMetaNotes(
  unmatchedCount: number,
  unmatched: { sourceText: string; createdRef: string }[],
): string {
  const lines: string[] = [];

  lines.push("Session B output — Demo Plan canonical seed.");
  lines.push("");
  lines.push("Decisions:");
  lines.push(
    "- Exercise refs use deterministic CUID-format hash (sha1(canonicalName) prefixed `c`) " +
      "so they pass `z.string().cuid()` validators in @repo/contracts/lms. Catalog entries " +
      "carry canonicalName as the human-readable form.",
  );
  lines.push(
    "- Label refs remain kebab-case (labelRefSchema accepts arbitrary string up to 64 chars).",
  );
  lines.push(
    "- Phase 7 examples emitted as flat phase7Examples list per briefing §7 and orchestrator " +
      "override (X9 relaxed; Session A appends them as synthetic week tail at totalWeeks+1).",
  );
  lines.push(
    "- weekOffsetFromTodayWeeks = -15 + (weekIndex - 1); todayWeekIndex = 16. Per orchestrator " +
      "override of briefing §6 arithmetic.",
  );
  lines.push(
    "- 34 archetypes acknowledged (33 sample + super-set from Phase 7), per orchestrator override " +
      "of stale `33 archetypes` text in coverage-matrix.md §3 / canonical-schema.ts header.",
  );
  lines.push("");
  lines.push("Schema gaps surfaced for orchestrator:");
  lines.push(
    "- canonical-schema.ts `canonicalSchemaNodeSchema` does NOT carry `trailingConnector` " +
      "(form: then/then_dots/then_n_rounds). Sample blocks 006/046/051/052/099/100 expose " +
      "connector lines (`then:` / `...then...:`), and composite-intervals-then-rounds " +
      "uses `...then N rounds:`. Coverage matrix §15 requires ≥1 occurrence per form — " +
      "currently emitted only as schema.notes free text. Session A must either extend " +
      "canonical-schema with `trailingConnector` field, or read connectors from notes.",
  );
  lines.push(
    "- exerciseFormSchema / archetypeParamsSchema / etc. in @repo/contracts/lms require `cuid()` " +
      "for exerciseId / pairedWithInnerRowId / tailExerciseId / SuperSetPair.schemaRows. " +
      "Briefing §5 said `kebab-case`; we resolved by using deterministic cuid-hash refs.",
  );
  lines.push(
    "- Phase 7 hardcoded block uses `blockInstanceRef = block-198` as a placeholder (out-of-sample, " +
      "no real inventory entry). Session A may want to mint dedicated phase-7 refs.",
  );
  lines.push("");
  lines.push("Best-effort gaps:");
  lines.push(
    "- 198-block body parser uses heuristic chunking + per-archetype emitters. Edge-case rows " +
      "(complex compound annotations, drop-set stage variants, per-set substitution annotations) " +
      "fall back to `notes` strings on the schema/row rather than first-class typed fields. " +
      "Session A's coverage assertion will surface specific cells that remain underfilled.",
  );

  if (unmatchedCount > 0) {
    lines.push(
      `- ${unmatchedCount} source exercise fragment(s) did not match the 149-entry canonical list; ` +
        "an adhoc catalog entry was created for each (UNKNOWN equipment/movement). Surface to coach for ratification:",
    );
    for (const u of unmatched.slice(0, 50)) {
      lines.push(`  · "${u.sourceText}" → ${u.createdRef}`);
    }

    if (unmatched.length > 50) {
      lines.push(`  … (+${unmatched.length - 50} more)`);
    }
  }

  return lines.join("\n");
}

function main(): void {
  const seed = buildCanonicalSeed();
  const json = JSON.stringify(seed, null, 2);

  writeFileSync(OUTPUT_PATH, json + "\n", "utf8");
  console.log(`Wrote ${OUTPUT_PATH} (${json.length} bytes)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
