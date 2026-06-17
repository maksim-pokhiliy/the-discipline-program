import { type Prisma } from "@prisma/client";
import { expect } from "vitest";

import { cleanupRaw } from "../../../test/helpers";

const ORDER_STEP = 10;

const ROW_INCLUDE = {
  modifierAssignments: { orderBy: { order: "asc" }, include: { modifier: true } },
} satisfies Prisma.SchemaRowInclude;

const SCHEMA_INCLUDE = {
  rows: { orderBy: { order: "asc" }, include: ROW_INCLUDE },
  rowGroups: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.SchemaInclude;

const BLOCK_INCLUDE = {
  labelAssignments: { orderBy: { order: "asc" }, include: { label: true } },
  schemas: { orderBy: { order: "asc" }, include: SCHEMA_INCLUDE },
  groups: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.BlockInclude;

const SESSION_INCLUDE = {
  blocks: { orderBy: { order: "asc" }, include: BLOCK_INCLUDE },
} satisfies Prisma.SessionInclude;

const DAY_INCLUDE = {
  sessions: { orderBy: { order: "asc" }, include: SESSION_INCLUDE },
} satisfies Prisma.DayInclude;

export type ReadRow = Prisma.SchemaRowGetPayload<{ include: typeof ROW_INCLUDE }>;
export type ReadSchema = Prisma.SchemaGetPayload<{ include: typeof SCHEMA_INCLUDE }>;
export type ReadBlock = Prisma.BlockGetPayload<{ include: typeof BLOCK_INCLUDE }>;
export type ReadSession = Prisma.SessionGetPayload<{ include: typeof SESSION_INCLUDE }>;
export type ReadDay = Prisma.DayGetPayload<{ include: typeof DAY_INCLUDE }>;

export const readRow = (rowId: string): Promise<ReadRow> =>
  cleanupRaw.schemaRow.findUniqueOrThrow({ where: { id: rowId }, include: ROW_INCLUDE });

export const readSchema = (schemaId: string): Promise<ReadSchema> =>
  cleanupRaw.schema.findUniqueOrThrow({ where: { id: schemaId }, include: SCHEMA_INCLUDE });

export const readBlock = (blockId: string): Promise<ReadBlock> =>
  cleanupRaw.block.findUniqueOrThrow({ where: { id: blockId }, include: BLOCK_INCLUDE });

export const readSession = (sessionId: string): Promise<ReadSession> =>
  cleanupRaw.session.findUniqueOrThrow({ where: { id: sessionId }, include: SESSION_INCLUDE });

export const readSessionsForDay = (dayId: string): Promise<ReadSession[]> =>
  cleanupRaw.session.findMany({
    where: { dayId },
    orderBy: { order: "asc" },
    include: SESSION_INCLUDE,
  });

export const readDaysForWeek = (weekId: string): Promise<ReadDay[]> =>
  cleanupRaw.day.findMany({
    where: { weekId },
    orderBy: { dayOfWeek: "asc" },
    include: DAY_INCLUDE,
  });

const assertResequenced = (orders: number[]): void => {
  expect(orders).toEqual(orders.map((_, index) => (index + 1) * ORDER_STEP));
};

const assertGroupingPreserved = <T extends { id: string }>(
  sourceMembers: readonly T[],
  cloneMembers: readonly T[],
  groupKey: (member: T) => string | null,
): void => {
  const sourceIds = new Set(sourceMembers.map((member) => member.id));
  const sourceGroupIds = new Set(
    sourceMembers.flatMap((member) => {
      const key = groupKey(member);

      return key === null ? [] : [key];
    }),
  );

  cloneMembers.forEach((cloneMember, index) => {
    const sourceMember = sourceMembers[index];
    const sourceKey = sourceMember ? groupKey(sourceMember) : null;
    const cloneKey = groupKey(cloneMember);

    expect(cloneKey === null).toBe(sourceKey === null);

    if (cloneKey !== null) {
      expect(sourceGroupIds.has(cloneKey)).toBe(false);
      expect(sourceIds.has(cloneKey)).toBe(false);
    }
  });
};

export const assertRowDeepEqual = (source: ReadRow, clone: ReadRow): void => {
  expect(clone.id).not.toBe(source.id);
  expect(clone.exerciseId).toBe(source.exerciseId);
  expect(clone.sets).toBe(source.sets);
  expect(clone.load).toEqual(source.load);
  expect(clone.reps).toEqual(source.reps);
  expect(clone.side).toEqual(source.side);
  expect(clone.tempo).toEqual(source.tempo);
  expect(clone.media).toEqual(source.media);
  expect(clone.intensity).toEqual(source.intensity);
  expect(clone.rest).toEqual(source.rest);
  expect(clone.notes).toEqual(source.notes);

  expect(clone.modifierAssignments).toHaveLength(source.modifierAssignments.length);
  source.modifierAssignments.forEach((sourceAssignment, index) => {
    const cloneAssignment = clone.modifierAssignments[index];

    expect(cloneAssignment?.modifierId).toBe(sourceAssignment.modifierId);
    expect(cloneAssignment?.order).toBe(sourceAssignment.order);
  });
};

export const assertSchemaDeepEqual = (source: ReadSchema, clone: ReadSchema): void => {
  expect(clone.id).not.toBe(source.id);
  expect(clone.header).toBe(source.header);
  expect(clone.composition).toEqual(source.composition);
  expect(clone.intensity).toEqual(source.intensity);
  expect(clone.notes).toEqual(source.notes);

  expect(clone.rowGroups).toHaveLength(source.rowGroups.length);
  source.rowGroups.forEach((sourceGroup, index) => {
    const cloneGroup = clone.rowGroups[index];

    expect(cloneGroup?.id).not.toBe(sourceGroup.id);
    expect(cloneGroup?.notes).toEqual(sourceGroup.notes);
  });

  expect(clone.rows).toHaveLength(source.rows.length);
  assertResequenced(clone.rows.map((row) => row.order));
  assertGroupingPreserved(source.rows, clone.rows, (row) => row.rowGroupId);

  source.rows.forEach((sourceRow, index) => {
    const cloneRow = clone.rows[index];

    expect(cloneRow).toBeDefined();

    if (cloneRow) {
      assertRowDeepEqual(sourceRow, cloneRow);
    }
  });
};

export const assertBlockDeepEqual = (source: ReadBlock, clone: ReadBlock): void => {
  expect(clone.id).not.toBe(source.id);
  expect(clone.notes).toEqual(source.notes);

  expect(clone.labelAssignments).toHaveLength(source.labelAssignments.length);
  source.labelAssignments.forEach((sourceAssignment, index) => {
    const cloneAssignment = clone.labelAssignments[index];

    expect(cloneAssignment?.labelId).toBe(sourceAssignment.labelId);
    expect(cloneAssignment?.order).toBe(sourceAssignment.order);
  });

  expect(clone.groups).toHaveLength(source.groups.length);
  source.groups.forEach((sourceGroup, index) => {
    const cloneGroup = clone.groups[index];

    expect(cloneGroup?.id).not.toBe(sourceGroup.id);
    expect(cloneGroup?.notes).toEqual(sourceGroup.notes);
    expect(cloneGroup?.interleaveOrder).toBe(sourceGroup.interleaveOrder);
  });

  expect(clone.schemas).toHaveLength(source.schemas.length);
  assertResequenced(clone.schemas.map((schema) => schema.order));
  assertGroupingPreserved(source.schemas, clone.schemas, (schema) => schema.groupId);

  source.schemas.forEach((sourceSchema, index) => {
    const cloneSchema = clone.schemas[index];

    expect(cloneSchema).toBeDefined();

    if (cloneSchema) {
      assertSchemaDeepEqual(sourceSchema, cloneSchema);
    }
  });
};

export const assertSessionDeepEqual = (source: ReadSession, clone: ReadSession): void => {
  expect(clone.id).not.toBe(source.id);
  expect(clone.labelId).toBe(source.labelId);
  expect(clone.notes).toEqual(source.notes);

  expect(clone.blocks).toHaveLength(source.blocks.length);
  assertResequenced(clone.blocks.map((block) => block.order));

  source.blocks.forEach((sourceBlock, index) => {
    const cloneBlock = clone.blocks[index];

    expect(cloneBlock).toBeDefined();

    if (cloneBlock) {
      assertBlockDeepEqual(sourceBlock, cloneBlock);
    }
  });
};

export const assertSessionsDeepEqual = (source: ReadSession[], clone: ReadSession[]): void => {
  expect(clone).toHaveLength(source.length);
  assertResequenced(clone.map((session) => session.order));

  source.forEach((sourceSession, index) => {
    const cloneSession = clone[index];

    expect(cloneSession).toBeDefined();

    if (cloneSession) {
      assertSessionDeepEqual(sourceSession, cloneSession);
    }
  });
};

export const assertDaysDeepEqual = (source: ReadDay[], clone: ReadDay[]): void => {
  expect(clone.map((day) => day.dayOfWeek)).toEqual(source.map((day) => day.dayOfWeek));

  source.forEach((sourceDay, index) => {
    const cloneDay = clone[index];

    expect(cloneDay).toBeDefined();

    if (cloneDay) {
      expect(cloneDay.id).not.toBe(sourceDay.id);
      expect(cloneDay.labelId).toBe(sourceDay.labelId);
      expect(cloneDay.notes).toEqual(sourceDay.notes);
      assertSessionsDeepEqual(sourceDay.sessions, cloneDay.sessions);
    }
  });
};
