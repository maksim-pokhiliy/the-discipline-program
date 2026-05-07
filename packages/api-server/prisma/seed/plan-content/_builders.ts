import { type Prisma, type PrismaClient } from "@prisma/client";

import { type Prescription, type SchemeParams } from "@repo/contracts/lms/_domain";

import { type SeededLibrary } from "../library";

const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export const must = <V>(map: Map<string, V>, name: string, kind: string): V => {
  const value = map.get(name);

  if (value === undefined) {
    throw new Error(`Seed: missing ${kind} "${name}"`);
  }

  return value;
};

export type ItemSpec = {
  exerciseName: string;
  prescription: Prescription;
  notes?: string;
};

export type BlockSpec = {
  blockTypeNames: readonly string[];
  schemeTypeName: string;
  schemeParams: SchemeParams;
  notes?: string;
  items: readonly ItemSpec[];
};

export type SessionSpec = {
  label: string | null;
  blocks: readonly BlockSpec[];
};

export type DaySpec = {
  date: Date;
  dayTypeName: string | null;
  sessions: readonly SessionSpec[];
};

export const buildDays = async (
  db: PrismaClient,
  planId: string,
  library: SeededLibrary,
  days: readonly DaySpec[],
): Promise<void> => {
  for (const day of days) {
    await buildDay(db, planId, library, day);
  }
};

const buildDay = async (
  db: PrismaClient,
  planId: string,
  library: SeededLibrary,
  spec: DaySpec,
): Promise<void> => {
  const planDay = await db.planDay.create({
    data: {
      planId,
      date: spec.date,
      dayTypeId:
        spec.dayTypeName === null ? null : must(library.dayTypes, spec.dayTypeName, "DayType").id,
    },
  });

  for (const [sessionIndex, session] of spec.sessions.entries()) {
    await buildSession(db, library, planDay.id, sessionIndex, session);
  }
};

const buildSession = async (
  db: PrismaClient,
  library: SeededLibrary,
  dayId: string,
  order: number,
  spec: SessionSpec,
): Promise<void> => {
  const planSession = await db.planSession.create({
    data: { dayId, order, label: spec.label },
  });

  for (const [blockIndex, block] of spec.blocks.entries()) {
    await buildBlock(db, library, planSession.id, blockIndex, block);
  }
};

const buildBlock = async (
  db: PrismaClient,
  library: SeededLibrary,
  sessionId: string,
  order: number,
  spec: BlockSpec,
): Promise<void> => {
  const schemeType = must(library.schemeTypes, spec.schemeTypeName, "SchemeType");

  const planBlock = await db.planBlock.create({
    data: {
      sessionId,
      order,
      schemeTypeId: schemeType.id,
      schemeParams: toInputJson(spec.schemeParams),
      notes: spec.notes ?? null,
    },
  });

  for (const [refIndex, blockTypeName] of spec.blockTypeNames.entries()) {
    const blockType = must(library.blockTypes, blockTypeName, "BlockType");

    await db.planBlockTypeRef.create({
      data: {
        blockId: planBlock.id,
        blockTypeId: blockType.id,
        order: refIndex,
      },
    });
  }

  for (const [itemIndex, item] of spec.items.entries()) {
    const exercise = must(library.exercises, item.exerciseName, "Exercise");

    await db.planItem.create({
      data: {
        blockId: planBlock.id,
        order: itemIndex,
        exerciseId: exercise.id,
        prescription: toInputJson(item.prescription),
        notes: item.notes ?? null,
      },
    });
  }
};
