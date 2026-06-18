import {
  dayOfWeekSchema,
  dayOfWeekValues,
  type Load,
  loadSchema,
  type Result,
  resultSchema,
} from "@repo/contracts/lms/_shared";
import { type Block } from "@repo/contracts/lms/block";
import { buildRowItems } from "@repo/contracts/lms/row-group";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { buildBlockItems } from "@repo/contracts/lms/schema-group";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import {
  type BlockItemView,
  type BlockView,
  type RowItemView,
  type RowView,
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import { mapToBlockWithSchemas } from "../../../mappers/lms";
import { resolveLoad } from "../athlete-records";
import { type AthleteLoadContext } from "../athlete-records";

import {
  type PerformedSessionWithResults,
  type SessionDetailRecord,
  type SessionDetailRow,
} from "./session-detail.types";

const DEFAULT_WORKOUT_TITLE = "Workout";

const SUNDAY_DAYS_FROM_MONDAY = 6;

type ExerciseMeta = { movement: string; demoUrl: string | null };

type BuildSessionDetailArgs = {
  session: SessionDetailRecord;
  ctx: AthleteLoadContext;
  performed: PerformedSessionWithResults[];
};

const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const mondayOfUtc = (date: Date): Date => {
  const weekday = date.getUTCDay();
  const offsetToMonday = weekday === 0 ? SUNDAY_DAYS_FROM_MONDAY : weekday - 1;

  return addUtcDays(date, -offsetToMonday);
};

export const weekMondayOfUtc = (date: Date): Date => mondayOfUtc(toUtcMidnight(date));

export const sessionAbsoluteDate = (session: SessionDetailRecord): Date => {
  const monday = weekMondayOfUtc(session.day.week.startDate);
  const dayOfWeek = dayOfWeekSchema.parse(session.day.dayOfWeek);

  return addUtcDays(monday, dayOfWeekValues.indexOf(dayOfWeek));
};

const referencedExerciseId = (load: Load): string | null =>
  load.kind === "percentage" && load.reference.scope === "other_exercise"
    ? load.reference.targetExerciseId
    : null;

export const collectExerciseIds = (session: SessionDetailRecord): string[] => {
  const ids = new Set<string>();

  for (const block of session.blocks) {
    for (const schema of block.schemas) {
      for (const row of schema.rows) {
        ids.add(row.exerciseId);

        const referenced =
          row.load === null ? null : referencedExerciseId(loadSchema.parse(row.load));

        if (referenced !== null) {
          ids.add(referenced);
        }
      }
    }
  }

  return [...ids];
};

const exerciseMetaOf = (row: SessionDetailRow): ExerciseMeta => ({
  movement: row.exercise.canonicalName,
  demoUrl: row.exercise.defaultDemoUrls[0] ?? null,
});

const collectExerciseMeta = (session: SessionDetailRecord): Map<string, ExerciseMeta> => {
  const byRowId = new Map<string, ExerciseMeta>();

  for (const block of session.blocks) {
    for (const schema of block.schemas) {
      for (const row of schema.rows) {
        byRowId.set(row.id, exerciseMetaOf(row));
      }
    }
  }

  return byRowId;
};

const buildRowView = (
  row: SchemaRow,
  ctx: AthleteLoadContext,
  metaByRowId: Map<string, ExerciseMeta>,
): RowView => {
  const meta = metaByRowId.get(row.id);

  return {
    rowId: row.id,
    movement: meta?.movement ?? "",
    media: row.media?.url ?? meta?.demoUrl ?? null,
    sets: row.sets,
    reps: row.reps,
    load: row.load,
    resolvedLoad: row.load === null ? null : resolveLoad(row.load, ctx, row.exerciseId),
    intensity: row.intensity,
    tempo: row.tempo,
    side: row.side,
    rest: row.rest,
    modifiers: row.modifiers.map((modifier) => modifier.name),
    notes: row.notes,
  };
};

const buildRowItemViews = (
  body: SchemaWithBody,
  ctx: AthleteLoadContext,
  metaByRowId: Map<string, ExerciseMeta>,
): RowItemView[] =>
  buildRowItems(body.rows, body.rowGroups).map((item) =>
    item.kind === "row"
      ? { kind: "row", row: buildRowView(item.row, ctx, metaByRowId) }
      : { kind: "group", members: item.members.map((row) => buildRowView(row, ctx, metaByRowId)) },
  );

const buildSchemaCard = (
  body: SchemaWithBody,
  ctx: AthleteLoadContext,
  metaByRowId: Map<string, ExerciseMeta>,
  existingResultBySchemaId: Map<string, Result>,
): SchemaCardView => {
  const { composition } = body.schema;
  const benchmark = composition?.benchmark ?? null;

  return {
    schemaId: body.schema.id,
    header: body.schema.header,
    composition,
    label: body.schema.label,
    isBenchmark: benchmark !== null,
    resultType: benchmark?.resultType ?? null,
    intensity: body.schema.intensity,
    existingResult: existingResultBySchemaId.get(body.schema.id) ?? null,
    items: buildRowItemViews(body, ctx, metaByRowId),
  };
};

const buildBlockItemViews = (
  block: Block,
  ctx: AthleteLoadContext,
  metaByRowId: Map<string, ExerciseMeta>,
  existingResultBySchemaId: Map<string, Result>,
): BlockItemView[] =>
  buildBlockItems(block.schemas, block.groups).map((item) => {
    if (item.kind === "schema") {
      return {
        kind: "schema",
        schema: buildSchemaCard(item.schema, ctx, metaByRowId, existingResultBySchemaId),
      };
    }

    return {
      kind: "parallel-group",
      trackCount: item.members.length,
      tracks: item.members.map((member) => ({
        header: member.schema.header,
        schema: buildSchemaCard(member, ctx, metaByRowId, existingResultBySchemaId),
      })),
    };
  });

const buildBlockView = (
  block: Block,
  ctx: AthleteLoadContext,
  metaByRowId: Map<string, ExerciseMeta>,
  existingResultBySchemaId: Map<string, Result>,
): BlockView => ({
  blockId: block.id,
  label: block.labels[0]?.name ?? null,
  intensity: block.intensity,
  note: block.notes?.[0] ?? null,
  items: buildBlockItemViews(block, ctx, metaByRowId, existingResultBySchemaId),
});

const collectExistingResults = (performed: PerformedSessionWithResults[]): Map<string, Result> => {
  const bySchemaId = new Map<string, Result>();

  for (const session of performed) {
    for (const entry of session.results) {
      bySchemaId.set(entry.plannedSchemaId, resultSchema.parse(entry.result));
    }
  }

  return bySchemaId;
};

const sessionTitle = (session: SessionDetailRecord): string =>
  session.label?.name ?? session.day.label?.name ?? DEFAULT_WORKOUT_TITLE;

const dayOrdinalOf = (session: SessionDetailRecord): number =>
  dayOfWeekValues.indexOf(dayOfWeekSchema.parse(session.day.dayOfWeek)) + 1;

const sessionPosition = (session: SessionDetailRecord): string => {
  const weekOrdinal =
    session.day.week.plan.weeks.findIndex((week) => week.id === session.day.weekId) + 1;
  const dayOrdinal = dayOrdinalOf(session);
  const planTitle = session.day.week.plan.name;

  return weekOrdinal > 0
    ? `Week ${weekOrdinal} · Day ${dayOrdinal} · ${planTitle}`
    : `Day ${dayOrdinal} · ${planTitle}`;
};

const sessionDatePart = (
  session: SessionDetailRecord,
): { dayOfWeek: SessionDetailResponse["session"]["dayOfWeek"]; dayOfMonth: number } => ({
  dayOfWeek: dayOfWeekSchema.parse(session.day.dayOfWeek),
  dayOfMonth: sessionAbsoluteDate(session).getUTCDate(),
});

const benchmarkCount = (blocks: BlockView[]): number =>
  blocks.reduce(
    (total, block) =>
      total +
      block.items.reduce((blockTotal, item) => {
        if (item.kind === "schema") {
          return blockTotal + (item.schema.isBenchmark ? 1 : 0);
        }

        return blockTotal + item.tracks.filter((track) => track.schema.isBenchmark).length;
      }, 0),
    0,
  );

const buildSummary = (blockCount: number, benchmarks: number): string => {
  const blockLabel = `${blockCount} ${blockCount === 1 ? "block" : "blocks"}`;

  return benchmarks === 0 ? blockLabel : `${blockLabel} · ${benchmarks} benchmark`;
};

export const buildSessionDetail = ({
  session,
  ctx,
  performed,
}: BuildSessionDetailArgs): SessionDetailResponse => {
  const metaByRowId = collectExerciseMeta(session);
  const existingResultBySchemaId = collectExistingResults(performed);
  const mappedBlocks = session.blocks.map(mapToBlockWithSchemas);
  const blocks = mappedBlocks.map((block) =>
    buildBlockView(block, ctx, metaByRowId, existingResultBySchemaId),
  );
  const { dayOfWeek, dayOfMonth } = sessionDatePart(session);

  return {
    session: {
      sessionId: session.id,
      planTitle: session.day.week.plan.name,
      position: sessionPosition(session),
      title: sessionTitle(session),
      dayOfWeek,
      dayOfMonth,
      summary: buildSummary(blocks.length, benchmarkCount(blocks)),
      done: performed.length > 0,
      completedAt: performed[0]?.performedAt ?? null,
    },
    blocks,
  };
};
