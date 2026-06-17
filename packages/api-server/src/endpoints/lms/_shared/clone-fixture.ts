import { type Prisma } from "@prisma/client";

import { cleanupRaw } from "../../../test/helpers";

const ORDER_STEP = 10;

export type CloneFixtureCatalog = {
  exerciseId: string;
  modifierAId: string;
  modifierBId: string;
  dayLabelId: string;
  sessionLabelId: string;
  blockLabelId: string;
};

const newId = (): string => crypto.randomUUID();

const DAYS_OF_WEEK: Prisma.DayCreateInput["dayOfWeek"][] = ["MONDAY", "WEDNESDAY"];

type BuiltLevels = {
  weekId: string;
  dayIds: string[];
  days: Prisma.DayCreateManyInput[];
  sessions: Prisma.SessionCreateManyInput[];
  blocks: Prisma.BlockCreateManyInput[];
  schemaGroups: Prisma.SchemaGroupCreateManyInput[];
  blockLabelAssignments: Prisma.BlockLabelAssignmentCreateManyInput[];
  schemas: Prisma.SchemaCreateManyInput[];
  rowGroups: Prisma.RowGroupCreateManyInput[];
  rows: Prisma.SchemaRowCreateManyInput[];
  modifierAssignments: Prisma.RowModifierAssignmentCreateManyInput[];
};

const buildSchemaRows = (
  schemaId: string,
  rowGroupId: string,
  catalog: CloneFixtureCatalog,
  levels: BuiltLevels,
): void => {
  const rowAId = newId();

  levels.rows.push(
    {
      id: rowAId,
      schemaId,
      rowGroupId,
      order: ORDER_STEP,
      exerciseId: catalog.exerciseId,
      sets: 3,
      load: { kind: "absolute", count: 1, kg: 60 },
      reps: { kind: "count", value: 5 },
      side: { kind: "each_leg", countPerLimb: 6 },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
      media: { url: "https://example.com/demo.mp4", label: "demo" },
      notes: ["grouped row A note"],
    },
    {
      id: newId(),
      schemaId,
      rowGroupId,
      order: ORDER_STEP * 2,
      exerciseId: catalog.exerciseId,
      sets: 4,
      load: { kind: "percentage", value: 75, reference: { scope: "self" } },
      reps: { kind: "range", min: 8, max: 12 },
      tempo: "explosive",
      notes: ["grouped row B note"],
    },
    {
      id: newId(),
      schemaId,
      order: ORDER_STEP * 3,
      exerciseId: catalog.exerciseId,
    },
  );

  levels.modifierAssignments.push(
    { id: newId(), rowId: rowAId, modifierId: catalog.modifierAId, order: 0 },
    { id: newId(), rowId: rowAId, modifierId: catalog.modifierBId, order: 1 },
  );
};

const buildSchemas = (blockId: string, catalog: CloneFixtureCatalog, levels: BuiltLevels): void => {
  const groupId = newId();

  levels.schemaGroups.push({
    id: groupId,
    blockId,
    notes: ["two-track group"],
    interleaveOrder: "round_by_round",
  });

  [
    { order: ORDER_STEP, groupId },
    { order: ORDER_STEP * 2, groupId },
    { order: ORDER_STEP * 3, groupId: null },
  ].forEach(({ order, groupId: schemaGroupId }) => {
    const schemaId = newId();
    const rowGroupId = newId();

    levels.schemas.push({
      id: schemaId,
      blockId,
      groupId: schemaGroupId,
      order,
      header: `Schema header ${order}`,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      intensity: { rpe: { value: 7 } },
      notes: [`schema note ${order}`],
    });

    levels.rowGroups.push({ id: rowGroupId, schemaId, notes: ["row group note"] });

    buildSchemaRows(schemaId, rowGroupId, catalog, levels);
  });
};

const buildBlocks = (
  sessionId: string,
  catalog: CloneFixtureCatalog,
  levels: BuiltLevels,
): void => {
  [
    { order: ORDER_STEP, withLabel: true },
    { order: ORDER_STEP * 2, withLabel: false },
  ].forEach(({ order, withLabel }) => {
    const blockId = newId();

    levels.blocks.push({ id: blockId, sessionId, order, notes: [`block note ${order}`] });

    if (withLabel) {
      levels.blockLabelAssignments.push({
        id: newId(),
        blockId,
        labelId: catalog.blockLabelId,
        order: ORDER_STEP,
      });
    }

    buildSchemas(blockId, catalog, levels);
  });
};

const buildSessions = (dayId: string, catalog: CloneFixtureCatalog, levels: BuiltLevels): void => {
  [ORDER_STEP, ORDER_STEP * 2].forEach((order) => {
    const sessionId = newId();

    levels.sessions.push({
      id: sessionId,
      dayId,
      order,
      labelId: catalog.sessionLabelId,
      notes: [`session note ${order}`],
    });

    buildBlocks(sessionId, catalog, levels);
  });
};

const buildLevels = (weekId: string, catalog: CloneFixtureCatalog): BuiltLevels => {
  const levels: BuiltLevels = {
    weekId,
    dayIds: [],
    days: [],
    sessions: [],
    blocks: [],
    schemaGroups: [],
    blockLabelAssignments: [],
    schemas: [],
    rowGroups: [],
    rows: [],
    modifierAssignments: [],
  };

  DAYS_OF_WEEK.forEach((dayOfWeek) => {
    const dayId = newId();

    levels.dayIds.push(dayId);
    levels.days.push({
      id: dayId,
      weekId,
      dayOfWeek,
      labelId: catalog.dayLabelId,
      notes: [`day note ${dayOfWeek}`],
    });

    buildSessions(dayId, catalog, levels);
  });

  return levels;
};

export type RichSubtree = {
  weekId: string;
  dayIds: string[];
  cleanup: () => Promise<void>;
};

export const buildRichSubtree = async (
  planId: string,
  startDate: Date,
  catalog: CloneFixtureCatalog,
): Promise<RichSubtree> => {
  const weekId = newId();
  const levels = buildLevels(weekId, catalog);

  await cleanupRaw.week.create({ data: { id: weekId, planId, startDate, notes: ["week note"] } });
  await cleanupRaw.day.createMany({ data: levels.days });
  await cleanupRaw.session.createMany({ data: levels.sessions });
  await cleanupRaw.block.createMany({ data: levels.blocks });
  await cleanupRaw.schemaGroup.createMany({ data: levels.schemaGroups });
  await cleanupRaw.blockLabelAssignment.createMany({ data: levels.blockLabelAssignments });
  await cleanupRaw.schema.createMany({ data: levels.schemas });
  await cleanupRaw.rowGroup.createMany({ data: levels.rowGroups });
  await cleanupRaw.schemaRow.createMany({ data: levels.rows });
  await cleanupRaw.rowModifierAssignment.createMany({ data: levels.modifierAssignments });

  return {
    weekId,
    dayIds: levels.dayIds,
    cleanup: () => cleanupRichSubtree(weekId),
  };
};

export const cleanupRichSubtree = async (weekId: string): Promise<void> => {
  const scope = { schema: { block: { session: { day: { weekId } } } } };

  await cleanupRaw.rowModifierAssignment.deleteMany({ where: { row: scope } }).catch(() => {});
  await cleanupRaw.schemaRow.deleteMany({ where: scope }).catch(() => {});
  await cleanupRaw.rowGroup.deleteMany({ where: scope }).catch(() => {});
  await cleanupRaw.blockLabelAssignment
    .deleteMany({ where: { block: { session: { day: { weekId } } } } })
    .catch(() => {});
  await cleanupRaw.schema
    .deleteMany({ where: { block: { session: { day: { weekId } } } } })
    .catch(() => {});
  await cleanupRaw.schemaGroup
    .deleteMany({ where: { block: { session: { day: { weekId } } } } })
    .catch(() => {});
  await cleanupRaw.block.deleteMany({ where: { session: { day: { weekId } } } }).catch(() => {});
  await cleanupRaw.session.deleteMany({ where: { day: { weekId } } }).catch(() => {});
  await cleanupRaw.day.deleteMany({ where: { weekId } }).catch(() => {});
  await cleanupRaw.week.delete({ where: { id: weekId } }).catch(() => {});
};
