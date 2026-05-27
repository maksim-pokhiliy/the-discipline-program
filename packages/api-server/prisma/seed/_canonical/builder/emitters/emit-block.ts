import { type Stage, type StagedProgram, type RestSpec } from "@repo/contracts/lms/_shared";

import {
  type CanonicalBlock,
  type CanonicalRow,
  type CanonicalSchemaNode,
} from "../../canonical-schema.js";
import { tryParseLoad } from "../extractors/load.js";
import {
  buildFootnoteRow,
  buildInnerLadderRow,
  buildRepDefRow,
  buildRestRow,
  buildStandaloneLoadRow,
  buildStandaloneUrlRow,
  classifyLine,
  parseExerciseRow,
  type RowDraft,
} from "../extractors/parse-row.js";
import { type BlockInventoryEntry } from "../parsers/inventory.js";
import { decomposeLabel } from "../parsers/labels.js";
import { type ArchetypeAssign } from "../parsers/mapping.js";
import { alternatingGroupRef, rowCuid } from "../utils/cuid.js";
import { type ExerciseResolver } from "../utils/exercise-resolver.js";

import { chunkBody } from "./chunk.js";
import {
  tryParseAlternatingSetsHeader,
  tryParseAmrapHeader,
  tryParseCompositeIntervalsHeader,
  tryParseCompositeRoundsRestHeader,
  tryParseEmomHeader,
  tryParseEmomSlotHeader,
  tryParseLadderSteps,
  tryParseNRoundsHeader,
  tryParseNamedExerciseHeader,
  tryParseNamedThemedHeader,
  tryParseOnOffMaxTailHeader,
  tryParseRollingRoundsHeader,
  tryParseTimeWindowHeader,
  tryParseWorkRestFixedHeader,
  tryParseWorkRestProgressiveHeader,
} from "./parse-header.js";

const PLACEHOLDER_REF_NULL: string = "c0000000000000000000000000"; // never written; kept for type-only contexts

interface EmitContext {
  resolver: ExerciseResolver;
  block: BlockInventoryEntry;
}

function emptyRow(): CanonicalRow {
  return {
    order: 0,
    rowKind: "EXERCISE",
    rowPayload: {
      rowKind: "EXERCISE",
      exercise: { form: "atomic", exerciseId: PLACEHOLDER_REF_NULL },
    },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: null,
  };
}

function freezeRow(draft: RowDraft, order: number, refId?: string): CanonicalRow {
  const row: CanonicalRow = { order, ...draft };

  if (refId) {
    row.refId = refId;
  }

  return row;
}

/** Walk body lines into rows for a "vanilla" schema body (no special structure). */
function emitVanillaRows(
  bodyLines: string[],
  ctx: EmitContext,
  schemaIdx: number,
  options: { implicitRepsForExercises?: boolean } = {},
): { rows: CanonicalRow[]; trailingNotes: string[] } {
  const rows: CanonicalRow[] = [];
  const trailingNotes: string[] = [];
  let order = 10;
  let rowIdx = 1;
  const schemaPath = `s${schemaIdx}`;

  for (const line of bodyLines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const cls = classifyLine(trimmed);
    let draft: RowDraft | null = null;

    if (cls.kind === "exercise") {
      const opts: { implicitReps?: boolean } = {};

      if (options.implicitRepsForExercises) {
        opts.implicitReps = true;
      }

      draft = parseExerciseRow(trimmed, { resolver: ctx.resolver, ...opts });
    } else if (cls.kind === "rest") {
      draft = buildRestRow(trimmed);
    } else if (cls.kind === "inner-ladder-marker") {
      draft = buildInnerLadderRow(trimmed);
    } else if (cls.kind === "standalone-load") {
      draft = buildStandaloneLoadRow(trimmed);
    } else if (cls.kind === "standalone-url") {
      draft = buildStandaloneUrlRow(trimmed);
    } else if (cls.kind === "rep-definition") {
      draft = buildRepDefRow(trimmed, { resolver: ctx.resolver });
    } else if (cls.kind === "footnote") {
      draft = buildFootnoteRow(trimmed, { resolver: ctx.resolver });
    } else if (
      cls.kind === "connector-then" ||
      cls.kind === "connector-then-dots" ||
      cls.kind === "connector-then-n-rounds"
    ) {
      trailingNotes.push(`connector: ${trimmed}`);
      continue;
    } else if (cls.kind === "example-annotation") {
      trailingNotes.push(`EXAMPLE: ${trimmed}`);
      continue;
    } else if (cls.kind === "explode-url") {
      // EXPLODE: URL inside drop-set schema — push as media note
      trailingNotes.push(trimmed);
      continue;
    } else if (cls.kind === "drop-set-annotation") {
      trailingNotes.push(trimmed);
      continue;
    } else if (cls.kind === "per-set-substitution-annotation") {
      trailingNotes.push(trimmed);
      continue;
    } else if (cls.kind === "header") {
      trailingNotes.push(`stray header inside body: ${trimmed}`);
      continue;
    } else if (cls.kind === "blank") {
      continue;
    } else {
      // unrecognised
      trailingNotes.push(`unparsed: ${trimmed}`);
      continue;
    }

    if (draft) {
      const refId = rowCuid(ctx.block.ref, schemaPath, rowIdx);

      rows.push(freezeRow(draft, order, refId));
      order += 10;
      rowIdx += 1;
    }
  }

  return { rows, trailingNotes };
}

/** Detect a header line in chunk; return header + remaining body lines. */
function splitHeaderAndBody(chunk: string[]): {
  header: string | null;
  body: string[];
} {
  for (let i = 0; i < chunk.length; i++) {
    const line = chunk[i]!.trim();

    if (!line) {
      continue;
    }

    return { header: line, body: chunk.slice(i + 1) };
  }

  return { header: null, body: chunk };
}

interface EmittedSchemaInfo {
  node: CanonicalSchemaNode;
}

/**
 * Per-archetype emitter. Receives the chunk of body lines belonging to this
 * schema + archetype name. Returns a CanonicalSchemaNode (recursive for nested).
 */
function emitSchemaForArchetype(
  archetype: string,
  schemaIdx: number,
  chunk: string[],
  mapping: ArchetypeAssign,
  ctx: EmitContext,
): EmittedSchemaInfo {
  const fallbackNode = (
    params: unknown,
    kind: CanonicalSchemaNode["kind"],
    rows: CanonicalRow[],
    header: string | null,
    notes: string | null,
  ): CanonicalSchemaNode => ({
    order: schemaIdx * 10,
    kind,
    archetype: { archetype, params } as unknown as CanonicalSchemaNode["archetype"],
    header,
    intensity: null,
    notes,
    alternatingGroupRef: null,
    alternatingGroupRelation: null,
    rows,
    subSchemas: [],
  });

  const { header, body } = splitHeaderAndBody(chunk);

  switch (archetype) {
    case "n-rounds": {
      const h = header ? tryParseNRoundsHeader(header) : null;
      const params = h ?? { countForm: "exact" as const, count: 1 };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "ATOMIC", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "n-rounds", params },
        },
      };
    }
    case "named-themed-sets": {
      const h = header ? tryParseNamedThemedHeader(header) : null;
      const params = h ?? { count: 1, theme: header ?? "" };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "NAMED", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "named-themed-sets", params },
        },
      };
    }
    case "ladder-descending":
    case "ladder-ascending":
    case "ladder-spike":
    case "ladder-vertex-down-pyramid": {
      const steps = header ? (tryParseLadderSteps(header) ?? [1]) : [1];
      const params = { steps };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx, {
        implicitRepsForExercises: true,
      });

      return {
        node: {
          ...fallbackNode(params, "ATOMIC", rows, header, joinNotes(trailingNotes)),
          archetype: {
            archetype: archetype as "ladder-descending",
            params,
          } as CanonicalSchemaNode["archetype"],
        },
      };
    }
    case "amrap-flat": {
      const h = header ? tryParseAmrapHeader(header) : null;
      const params = h ?? { durationMin: 12 };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);
      // Extract schema-level intensity from any [N% Effort] / [N-M% Effort] body annotation
      const node = fallbackNode(params, "ATOMIC", rows, header, joinNotes(trailingNotes));
      const schemaIntensity = extractSchemaIntensityFromBody(body);

      if (schemaIntensity) {
        node.intensity = schemaIntensity;
      }

      node.archetype = { archetype: "amrap-flat", params };

      return { node };
    }
    case "emom-nested-per-minute": {
      const h = header ? tryParseEmomHeader(header) : null;
      const params: { durationMin: number; rounds?: number } = h ?? { durationMin: 12 };
      // sub-schemas: emom-sub-minute-slot
      const subSchemas: CanonicalSchemaNode[] = [];
      const subChunks = chunkSubSlots(body);

      subChunks.forEach((sub, idx) => {
        const subAssign = mapping.subSchemas[idx];

        subSchemas.push(
          emitEmomSubSlot(
            sub,
            idx + 1,
            schemaIdx,
            ctx,
            subAssign?.archetype ?? "emom-sub-minute-slot",
          ),
        );
      });

      return {
        node: {
          order: schemaIdx * 10,
          kind: "NESTED",
          archetype: { archetype: "emom-nested-per-minute", params },
          header,
          intensity: null,
          notes: null,
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows: [],
          subSchemas,
        },
      };
    }
    case "time-window-outer": {
      const h = header ? tryParseTimeWindowHeader(header) : null;
      const params = { window: h ?? { startHhMm: "0:00", endHhMm: "10:00" } };
      // sub-schemas
      const subSchemas = mapping.subSchemas.map(
        (sa, idx) =>
          emitSchemaForArchetype(sa.archetype, idx + 1, body, sa as unknown as ArchetypeAssign, ctx)
            .node,
      );

      // Fallback: if mapping has subschemas, take whole body as 1 sub
      if (subSchemas.length === 0 && body.length > 0) {
        const innerHeader = body.find((l) => l.trim().length > 0) ?? null;
        const innerChunk = body;

        subSchemas.push(
          emitSchemaForArchetype(
            "n-rounds",
            1,
            innerChunk,
            { schemaOrder: 1, archetype: "n-rounds", subSchemas: [] },
            ctx,
          ).node,
        );
        void innerHeader;
      }

      return {
        node: {
          order: schemaIdx * 10,
          kind: "NESTED",
          archetype: { archetype: "time-window-outer", params },
          header,
          intensity: null,
          notes: null,
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows: [],
          subSchemas,
        },
      };
    }
    case "composite-rounds-with-rest": {
      const h = header ? tryParseCompositeRoundsRestHeader(header) : null;
      const params = h ?? {
        count: 3,
        rest: { duration: { value: 1, unit: "min" }, scope: "between_rounds" } as RestSpec,
      };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "composite-rounds-with-rest", params },
        },
      };
    }
    case "composite-intervals-then-rounds": {
      const h = header ? tryParseCompositeIntervalsHeader(header) : null;
      // Preamble exercise: first row of body until connector
      let preambleExercise: import("@repo/contracts/lms/_shared").ExerciseForm = {
        form: "atomic",
        exerciseId: ctx.resolver.resolve("jumping Jacks"),
      };
      let preambleReps: import("@repo/contracts/lms/_shared").RepNotation = {
        kind: "count",
        value: 1,
      };
      let innerRounds = 2;
      const cleanBody: string[] = [];
      let connectorSeen = false;

      for (const line of body) {
        const t = line.trim();
        const connMatch =
          t.match(/^\.\.\.then\s+(\d+)\s+rounds?\s*:?$/i) ??
          t.match(/^\.\.\.THEN\s+(\d+)\s+rounds?\s*:?$/);

        if (connMatch && !connectorSeen) {
          innerRounds = parseInt(connMatch[1]!, 10);
          connectorSeen = true;
          continue;
        }

        if (!connectorSeen && /^\d+\s+/.test(t)) {
          // preamble
          const draft = parseExerciseRow(t, { resolver: ctx.resolver });

          if (draft.rowPayload.rowKind === "EXERCISE") {
            preambleExercise = draft.rowPayload.exercise;

            if (draft.reps) {
              preambleReps = draft.reps;
            }
          }
        } else {
          cleanBody.push(line);
        }
      }
      const params = {
        intervalsCount: h?.intervalsCount ?? 3,
        restMin: h?.restMin ?? 2,
        innerRounds,
        preambleExercise,
        preambleReps,
      };
      const { rows, trailingNotes } = emitVanillaRows(cleanBody, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "composite-intervals-then-rounds", params },
        },
      };
    }
    case "composite-intervals-work-rest-fixed": {
      const h = header ? tryParseWorkRestFixedHeader(header) : null;
      const params = h ?? { intervalsCount: 3, workMin: 3, restMin: 2 };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "composite-intervals-work-rest-fixed", params },
        },
      };
    }
    case "composite-intervals-work-rest-progressive": {
      const h = header ? tryParseWorkRestProgressiveHeader(header) : null;
      // EXAMPLE annotation → schema.notes (per Q15)
      const noteLines: string[] = [];
      const cleanBody: string[] = [];

      for (const line of body) {
        if (/^EXAMPLE\s*\[/i.test(line.trim())) {
          noteLines.push(line.trim());
        } else {
          cleanBody.push(line);
        }
      }
      const params = {
        sets: h?.sets ?? 3,
        workMin: h?.workMin ?? 2,
        offMin: h?.offMin ?? 2,
        progressiveSeed: noteLines[0] ?? "1-2-3 etc.",
      };
      const { rows, trailingNotes } = emitVanillaRows(cleanBody, ctx, schemaIdx);
      const allNotes = [...noteLines, ...trailingNotes];

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(allNotes)),
          archetype: { archetype: "composite-intervals-work-rest-progressive", params },
        },
      };
    }
    case "composite-intervals-on-off-max-tail": {
      const h = header ? tryParseOnOffMaxTailHeader(header) : null;
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);
      // tail exercise = last EXERCISE row's exerciseId if atomic
      let tailExerciseId = ctx.resolver.resolve("strict HSPU");

      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i]!;

        if (r.rowPayload.rowKind === "EXERCISE" && r.rowPayload.exercise.form === "atomic") {
          tailExerciseId = r.rowPayload.exercise.exerciseId;
          break;
        }
      }
      const params = {
        intervals: h?.intervals ?? 5,
        onMin: h?.onMin ?? 2,
        offMin: h?.offMin ?? 2,
        tailExerciseId,
      };

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "composite-intervals-on-off-max-tail", params },
        },
      };
    }
    case "composite-rolling-rounds": {
      const h = header ? tryParseRollingRoundsHeader(header) : null;
      const params = h ?? { everyNthMin: 4, rounds: 4, totalMin: 16 };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "COMPOSITE", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "composite-rolling-rounds", params },
        },
      };
    }
    case "nested-rounds-over-rounds":
    case "nested-rounds-over-parallel-ladder":
    case "nested-composite-rounds-over-ladder": {
      const isComposite = archetype === "nested-composite-rounds-over-ladder";
      let params: unknown;

      if (isComposite) {
        const rest = header ? tryParseCompositeRoundsRestHeader(header)?.rest : null;
        const outerCount = header ? (parseFirstNumber(header) ?? 3) : 3;

        params = {
          outerCount,
          rest:
            rest ?? ({ duration: { value: 2, unit: "min" }, scope: "between_sets" } as RestSpec),
        };
      } else {
        const outerCount = header ? (parseFirstNumber(header) ?? 2) : 2;

        params = { outerCount };
      }

      const subSchemas = mapping.subSchemas.map(
        (sa, idx) =>
          emitSchemaForArchetype(sa.archetype, idx + 1, body, sa as unknown as ArchetypeAssign, ctx)
            .node,
      );

      return {
        node: {
          order: schemaIdx * 10,
          kind: "NESTED",
          archetype: { archetype, params } as CanonicalSchemaNode["archetype"],
          header,
          intensity: null,
          notes: null,
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows: [],
          subSchemas,
        },
      };
    }
    case "named-exercise-program": {
      const h = header ? tryParseNamedExerciseHeader(header) : null;
      const exerciseId = ctx.resolver.resolve(
        h?.exerciseText ?? header ?? "DB Bulgarian split squats",
      );
      // detect drop-set annotation in body
      const dropSetLine = body.find((l) => /^\d+\s+sets\s*\[\s*x\d+\s*\[/i.test(l.trim()));
      const explodeUrlLine = body.find((l) => /\[\s*EXPLODE:\s*https?:\/\//i.test(l.trim()));
      let program: StagedProgram;

      if (dropSetLine) {
        program = parseDropSetAnnotation(dropSetLine, explodeUrlLine);
      } else {
        program = {
          programKind: "drop_set",
          stages: [{ reps: 5, load: { kind: "unspecified" } }],
        };
      }

      const params = { exerciseId, program };
      const cleanBody = body.filter((l) => {
        const t = l.trim();

        return !/^\d+\s+sets\s*\[\s*x\d+\s*\[/i.test(t) && !/^\[\s*EXPLODE:\s*https?:\/\//i.test(t);
      });
      const { rows, trailingNotes } = emitVanillaRows(cleanBody, ctx, schemaIdx);

      return {
        node: {
          ...fallbackNode(params, "NAMED", rows, header, joinNotes(trailingNotes)),
          archetype: { archetype: "named-exercise-program", params },
        },
      };
    }
    case "alternating-sets": {
      const h = header ? tryParseAlternatingSetsHeader(header) : null;
      const params = h ?? { setEnumeration: [1, 3, 5] };
      const { rows, trailingNotes } = emitVanillaRows(body, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "ATOMIC",
          archetype: { archetype: "alternating-sets", params },
          header,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: alternatingGroupRef(ctx.block.ref, "group-1"),
          alternatingGroupRelation: "ALTERNATING_SETS",
          rows,
          subSchemas: [],
        },
      };
    }
    case "parallel-ladders-descending":
    case "parallel-ladders-mixed-direction":
    case "parallel-pyramids": {
      // headerless; body alternates inner-ladder-marker + exercise row pairs
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes, ladders } = emitParallelLadders(
        allLines,
        ctx,
        schemaIdx,
        archetype === "parallel-pyramids",
      );
      const params = archetype === "parallel-pyramids" ? { pyramids: ladders } : { ladders };

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype, params } as CanonicalSchemaNode["archetype"],
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "single-line-with-then-connector": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "single-line-with-then-connector", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "single-line-bare": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "single-line-bare", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "single-line-total-counter": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: {
            archetype: "single-line-total-counter",
            params: { totalFlag: true as const },
          },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "flat-list-headerless": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "flat-list-headerless", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "pull-ups-dips-cycle": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "pull-ups-dips-cycle", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "run-distance": {
      const allLines = header ? [header, ...body] : body;
      const firstRunLine = allLines.find((l) => /run/i.test(l));
      const runParams: RunDistanceParams = firstRunLine
        ? parseRunHeader(firstRunLine)
        : { modality: "RUN" };
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "run-distance", params: runParams },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "placeholder-body": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "placeholder-body", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "practice-list": {
      const allLines = header ? [header, ...body] : body;
      const { rows, trailingNotes } = emitVanillaRows(allLines, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "practice-list", params: {} },
          header: null,
          intensity: null,
          notes: joinNotes(trailingNotes),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "url-only-body": {
      const allLines = header ? [header, ...body] : body;
      const rows: CanonicalRow[] = [];
      let order = 10;
      let rowIdx = 1;
      const schemaPath = `s${schemaIdx}`;

      for (const line of allLines) {
        const t = line.trim();

        if (!t) {
          continue;
        }

        const draft = buildStandaloneUrlRow(t);

        if (draft) {
          rows.push(freezeRow(draft, order, rowCuid(ctx.block.ref, schemaPath, rowIdx)));
          order += 10;
          rowIdx += 1;
        }
      }

      return {
        node: {
          order: schemaIdx * 10,
          kind: "HEADERLESS",
          archetype: { archetype: "url-only-body", params: {} },
          header: null,
          intensity: null,
          notes: null,
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
    case "emom-sub-minute-slot": {
      // shouldn't reach here at top-level (sub-only); emit defensive
      return {
        node: {
          order: schemaIdx * 10,
          kind: "ATOMIC",
          archetype: {
            archetype: "emom-sub-minute-slot",
            params: { slot: { kind: "single" as const, minute: 1 } },
          },
          header,
          intensity: null,
          notes: null,
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows: [],
          subSchemas: [],
        },
      };
    }
    default: {
      // unknown archetype — emit minimal n-rounds default
      const { rows, trailingNotes } = emitVanillaRows(chunk, ctx, schemaIdx);

      return {
        node: {
          order: schemaIdx * 10,
          kind: "ATOMIC",
          archetype: {
            archetype: "n-rounds",
            params: { countForm: "exact", count: 1 },
          },
          header,
          intensity: null,
          notes: joinNotes([...trailingNotes, `unknown archetype: ${archetype}`]),
          alternatingGroupRef: null,
          alternatingGroupRelation: null,
          rows,
          subSchemas: [],
        },
      };
    }
  }
}

function emitEmomSubSlot(
  chunk: string[],
  subOrder: number,
  outerSchemaIdx: number,
  ctx: EmitContext,
  _archetype: string,
): CanonicalSchemaNode {
  const { header, body } = splitHeaderAndBody(chunk);
  const slot = header ? tryParseEmomSlotHeader(header) : null;
  const slotSpec =
    slot && slot.kind === "grouped"
      ? { kind: "grouped" as const, minutes: slot.minutes }
      : slot
        ? { kind: "single" as const, minute: slot.minutes[0]! }
        : { kind: "single" as const, minute: subOrder };

  // body parsing
  const rows: CanonicalRow[] = [];
  let order = 10;
  let rowIdx = 1;
  const schemaPath = `s${outerSchemaIdx}-sub${subOrder}`;

  for (const line of body) {
    const t = line.trim();

    if (!t) {
      continue;
    }

    if (/^REST$/i.test(t)) {
      rows.push({
        ...emptyRow(),
        order,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
        refId: rowCuid(ctx.block.ref, schemaPath, rowIdx),
      });
      order += 10;
      rowIdx += 1;
      continue;
    }

    const cls = classifyLine(t);
    let draft: RowDraft | null = null;

    if (cls.kind === "exercise") {
      draft = parseExerciseRow(t, { resolver: ctx.resolver });
    } else if (cls.kind === "rest") {
      draft = buildRestRow(t);
    } else if (cls.kind === "inner-ladder-marker") {
      draft = buildInnerLadderRow(t);
    }

    if (draft) {
      rows.push(freezeRow(draft, order, rowCuid(ctx.block.ref, schemaPath, rowIdx)));
      order += 10;
      rowIdx += 1;
    }
  }

  return {
    order: subOrder * 10,
    kind: "ATOMIC",
    archetype: { archetype: "emom-sub-minute-slot", params: { slot: slotSpec } },
    header,
    intensity: null,
    notes: null,
    alternatingGroupRef: null,
    alternatingGroupRelation: null,
    rows,
    subSchemas: [],
  };
}

/**
 * Split EMOM body into sub-slot chunks. Source format is either:
 *  - multi-line (`N min:\nbody-line`) — rare
 *  - inline (`N min: body-content`) — dominant in sample (block-079..082)
 */
function chunkSubSlots(body: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let seenHeader = false;
  // matches inline OR bare: `1 min`, `1 min:`, `1 min: body`, `1st & 2nd min: body`
  const inlineRe = /^(\d+(?:st|nd|rd|th)?(?:\s*&\s*\d+(?:st|nd|rd|th)?)?\s+min)\s*:?\s*(.*)$/i;

  for (const line of body) {
    const t = line.trim();

    if (!t) {
      continue;
    }

    if (t.startsWith("-")) {
      // inline rest separator inside EMOM body (between two EMOM schemas) — flush current chunk
      if (seenHeader && current.length) {
        chunks.push(current);
      }

      current = [];
      seenHeader = false;
      continue;
    }

    const m = t.match(inlineRe);

    if (m) {
      if (seenHeader && current.length) {
        chunks.push(current);
      }

      const header = `${m[1]!.trim()}:`;
      const inline = (m[2] ?? "").trim();

      current = inline ? [header, inline] : [header];
      seenHeader = true;
      continue;
    }

    if (seenHeader) {
      current.push(line);
    }
  }

  if (current.length) {
    chunks.push(current);
  }

  return chunks;
}

function parseFirstNumber(text: string): number | null {
  const m = text.match(/(\d+)/);

  return m ? parseInt(m[1]!, 10) : null;
}

function joinNotes(notes: string[]): string | null {
  if (notes.length === 0) {
    return null;
  }

  const joined = notes.join("\n");

  return joined.length > 4000 ? joined.slice(0, 3990) + "...[trunc]" : joined;
}

function extractSchemaIntensityFromBody(
  body: string[],
): { effortPercent: { value: number } | { range: { min: number; max: number } } } | null {
  for (const line of body) {
    const m = line.trim().match(/^\[\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*%\s*Effort\s*\]$/i);

    if (m) {
      if (m[2]) {
        return {
          effortPercent: {
            range: { min: parseInt(m[1]!, 10), max: parseInt(m[2]!, 10) },
          },
        };
      }

      return { effortPercent: { value: parseInt(m[1]!, 10) } };
    }
  }

  return null;
}

function emitParallelLadders(
  lines: string[],
  ctx: EmitContext,
  schemaIdx: number,
  isPyramid: boolean,
): {
  rows: CanonicalRow[];
  trailingNotes: string[];
  ladders: { steps: number[]; pairedWithInnerRowId?: string; direction?: "asc" | "desc" }[];
} {
  const rows: CanonicalRow[] = [];
  const trailingNotes: string[] = [];
  const ladders: { steps: number[]; pairedWithInnerRowId?: string; direction?: "asc" | "desc" }[] =
    [];
  let order = 10;
  let rowIdx = 1;
  const schemaPath = `s${schemaIdx}`;
  let pendingSteps: number[] | null = null;
  let pendingDirection: "asc" | "desc" | undefined;

  for (const line of lines) {
    const t = line.trim();

    if (!t) {
      continue;
    }

    const markerMatch = t.match(/^(\d+(?:-\d+){1,})\s*:?$/);

    if (markerMatch && !/[a-z]/i.test(markerMatch[1]!)) {
      const steps = markerMatch[1]!.split("-").map((s) => parseInt(s, 10));

      pendingSteps = steps;
      pendingDirection = inferLadderDirection(steps);
      const refId = rowCuid(ctx.block.ref, schemaPath, rowIdx);

      rows.push({
        ...emptyRow(),
        order,
        rowKind: "INNER_LADDER_MARKER",
        rowPayload: { rowKind: "INNER_LADDER_MARKER", steps },
        refId,
      });
      order += 10;
      rowIdx += 1;
      continue;
    }

    const cls = classifyLine(t);

    if (cls.kind === "exercise") {
      const draft = parseExerciseRow(t, { resolver: ctx.resolver, implicitReps: true });
      const refId = rowCuid(ctx.block.ref, schemaPath, rowIdx);

      rows.push(freezeRow(draft, order, refId));

      if (pendingSteps) {
        const ladderEntry: {
          steps: number[];
          pairedWithInnerRowId: string;
          direction?: "asc" | "desc";
        } = { steps: pendingSteps, pairedWithInnerRowId: refId };

        if (pendingDirection) {
          ladderEntry.direction = pendingDirection;
        }

        ladders.push(ladderEntry);
        pendingSteps = null;
        pendingDirection = undefined;
      }

      order += 10;
      rowIdx += 1;
    } else if (cls.kind === "rest") {
      const d = buildRestRow(t);

      if (d) {
        rows.push(freezeRow(d, order, rowCuid(ctx.block.ref, schemaPath, rowIdx)));
        order += 10;
        rowIdx += 1;
      }
    } else if (cls.kind === "example-annotation") {
      trailingNotes.push(t);
    } else {
      trailingNotes.push(`unparsed: ${t}`);
    }
  }
  void isPyramid;

  return { rows, trailingNotes, ladders };
}

function inferLadderDirection(steps: number[]): "asc" | "desc" {
  if (steps.length < 2) {
    return "desc";
  }

  return steps[1]! > steps[0]! ? "asc" : "desc";
}

type RunDistanceParams = Extract<
  CanonicalSchemaNode["archetype"],
  { archetype: "run-distance" }
>["params"];

function parseRunHeader(line: string): RunDistanceParams {
  const trimmed = line.trim();
  const runRange = trimmed.match(
    /^(?:RUN\s+)?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*km(?:\s+run)?$/i,
  );

  if (runRange) {
    return {
      modality: "RUN",
      distance: {
        unit: "km",
        range: { min: parseFloat(runRange[1]!), max: parseFloat(runRange[2]!) },
      },
    };
  }

  const runValue = trimmed.match(/^(?:RUN\s+)?(\d+(?:\.\d+)?)\s*km(?:\s+run)?$/i);

  if (runValue) {
    return {
      modality: "RUN",
      distance: { unit: "km", value: parseFloat(runValue[1]!) },
    };
  }

  return { modality: "RUN" };
}

function parseDropSetAnnotation(line: string, explodeUrlLine: string | undefined): StagedProgram {
  const trimmed = line.trim();
  // form: `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]`
  const setsM = trimmed.match(/^(\d+)\s+sets\s*\[(.+)\]$/i);
  const setsCount = setsM ? parseInt(setsM[1]!, 10) : 3;
  const inner = setsM ? setsM[2]! : trimmed;
  const stageParts = inner.split("...then...").map((s) => s.trim());
  const stages: Stage[] = stageParts.map((sp, idx) => {
    const sm = sp.match(/^x(\d+)\s*\[\s*([^\]]+)\s*\]$/i);
    let reps = 5;
    let loadInner = "";

    if (sm) {
      reps = parseInt(sm[1]!, 10);
      loadInner = sm[2]!.trim();
    }

    const stage: Stage = { reps };
    const load = tryParseLoad(loadInner);

    if (load) {
      stage.load = load;
    }

    if (idx === stageParts.length - 1 && /EXPLODE/i.test(loadInner)) {
      stage.indicator = "explode";
      stage.label = "EXPLODE";

      if (explodeUrlLine) {
        const m = explodeUrlLine.match(/^\[\s*EXPLODE:\s*(https?:\/\/[^\s\]]+)\s*\]$/i);

        if (m) {
          stage.media = {
            url: m[1]!,
            position: "inline",
            label: "EXPLODE",
            appliesTo: "drop_stage",
          };
        }
      }
    }

    return stage;
  });

  return {
    programKind: "drop_set",
    stages,
    setsCount,
    stageCountPerSet: stages.length,
    separatorForm: "...then...",
  };
}

/** Emit a full block (with its labels + intensity + schemas) for a given location. */
export function emitBlock(
  inventory: BlockInventoryEntry,
  mapping: ArchetypeAssign[],
  order: number,
  ctx: { resolver: ExerciseResolver },
): CanonicalBlock {
  const decomp = decomposeLabel(inventory.label);
  const block: CanonicalBlock = {
    blockInstanceRef: inventory.ref,
    order,
    labels: decomp.labelRefs,
    intensity: decomp.intensityEffortPercent
      ? { effortPercent: decomp.intensityEffortPercent }
      : null,
    timeCap: decomp.timeCap ?? null,
    notes: null,
    schemas: [],
  };

  if (mapping.length === 0 || !inventory.rawBody) {
    return block;
  }

  // Detect pace from label (EASY PACE → schema-level, attached to first schema)
  // (EASY PACE was decomposed as a label, not extracted intensity, but we keep block.intensity for effortPercent.)

  const chunks = chunkBody(inventory.rawBody, mapping);
  const emitCtx: EmitContext = { resolver: ctx.resolver, block: inventory };

  mapping.forEach((m, idx) => {
    const chunk = chunks[idx] ?? [];
    const node = emitSchemaForArchetype(m.archetype, idx + 1, chunk, m, emitCtx).node;

    // schema header injection for labels Rule 2
    if (idx === 0 && decomp.schemaHeaderPrefix && node.header === null) {
      node.header = decomp.schemaHeaderPrefix;
    }

    block.schemas.push(node);
  });

  return block;
}
