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

const buildSchema = async (
  blockId: string,
  order: number,
  catalog: CloneFixtureCatalog,
  groupId: string | null,
): Promise<string> => {
  const schema = await cleanupRaw.schema.create({
    data: {
      blockId,
      groupId,
      order,
      header: `Schema header ${order}`,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      intensity: { rpe: { value: 7 } },
      notes: [`schema note ${order}`],
    },
  });

  const rowGroup = await cleanupRaw.rowGroup.create({
    data: { schemaId: schema.id, notes: ["row group note"] },
  });

  const groupedRowA = await cleanupRaw.schemaRow.create({
    data: {
      schemaId: schema.id,
      rowGroupId: rowGroup.id,
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
  });

  await cleanupRaw.rowModifierAssignment.createMany({
    data: [
      { rowId: groupedRowA.id, modifierId: catalog.modifierAId, order: 0 },
      { rowId: groupedRowA.id, modifierId: catalog.modifierBId, order: 1 },
    ],
  });

  await cleanupRaw.schemaRow.create({
    data: {
      schemaId: schema.id,
      rowGroupId: rowGroup.id,
      order: ORDER_STEP * 2,
      exerciseId: catalog.exerciseId,
      sets: 4,
      load: { kind: "percentage", value: 75, reference: { scope: "self" } },
      reps: { kind: "range", min: 8, max: 12 },
      tempo: "explosive",
      notes: ["grouped row B note"],
    },
  });

  await cleanupRaw.schemaRow.create({
    data: {
      schemaId: schema.id,
      order: ORDER_STEP * 3,
      exerciseId: catalog.exerciseId,
    },
  });

  return schema.id;
};

const buildBlock = async (
  sessionId: string,
  order: number,
  catalog: CloneFixtureCatalog,
  withLabel: boolean,
): Promise<string> => {
  const block = await cleanupRaw.block.create({
    data: { sessionId, order, notes: [`block note ${order}`] },
  });

  if (withLabel) {
    await cleanupRaw.blockLabelAssignment.create({
      data: { blockId: block.id, labelId: catalog.blockLabelId, order: ORDER_STEP },
    });
  }

  const group = await cleanupRaw.schemaGroup.create({
    data: { blockId: block.id, notes: ["two-track group"], interleaveOrder: "round_by_round" },
  });

  await buildSchema(block.id, ORDER_STEP, catalog, group.id);
  await buildSchema(block.id, ORDER_STEP * 2, catalog, group.id);
  await buildSchema(block.id, ORDER_STEP * 3, catalog, null);

  return block.id;
};

const buildSession = async (
  dayId: string,
  order: number,
  catalog: CloneFixtureCatalog,
): Promise<string> => {
  const session = await cleanupRaw.session.create({
    data: {
      dayId,
      order,
      labelId: catalog.sessionLabelId,
      notes: [`session note ${order}`],
    },
  });

  await buildBlock(session.id, ORDER_STEP, catalog, true);
  await buildBlock(session.id, ORDER_STEP * 2, catalog, false);

  return session.id;
};

const buildDay = async (
  weekId: string,
  dayOfWeek: Prisma.DayCreateInput["dayOfWeek"],
  catalog: CloneFixtureCatalog,
): Promise<string> => {
  const day = await cleanupRaw.day.create({
    data: { weekId, dayOfWeek, labelId: catalog.dayLabelId, notes: [`day note ${dayOfWeek}`] },
  });

  await buildSession(day.id, ORDER_STEP, catalog);
  await buildSession(day.id, ORDER_STEP * 2, catalog);

  return day.id;
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
  const week = await cleanupRaw.week.create({
    data: { planId, startDate, notes: ["week note"] },
  });

  const dayIds = [
    await buildDay(week.id, "MONDAY", catalog),
    await buildDay(week.id, "WEDNESDAY", catalog),
  ];

  return {
    weekId: week.id,
    dayIds,
    cleanup: () => cleanupRichSubtree(week.id),
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
