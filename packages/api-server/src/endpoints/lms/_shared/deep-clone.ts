import { type Prisma } from "@prisma/client";

import { InternalServerError } from "@repo/errors";

import { marshalNullableJson } from "../../../utils";
import { assertGroupMembersContiguous } from "../schema/assertions";
import { assertRowGroupMembersContiguous } from "../schema-row/assertions";

import { SCHEMA_BODY_INCLUDE } from "./schema-body-include";
import { type TxClient } from "./tx-client";

const ORDER_STEP = 10;

export const ROW_SUBTREE_INCLUDE = SCHEMA_BODY_INCLUDE.rows.include;
export const SCHEMA_SUBTREE_INCLUDE = SCHEMA_BODY_INCLUDE;
export const BLOCK_SUBTREE_INCLUDE = {
  labelAssignments: { orderBy: { order: "asc" }, include: { label: true } },
  schemas: { orderBy: { order: "asc" }, include: SCHEMA_BODY_INCLUDE },
  groups: true,
} satisfies Prisma.BlockInclude;
export const SESSION_SUBTREE_INCLUDE = {
  blocks: { orderBy: { order: "asc" }, include: BLOCK_SUBTREE_INCLUDE },
} satisfies Prisma.SessionInclude;

type SourceRow = Prisma.SchemaRowGetPayload<{ include: typeof ROW_SUBTREE_INCLUDE }>;
type SourceSchema = Prisma.SchemaGetPayload<{ include: typeof SCHEMA_SUBTREE_INCLUDE }>;
type SourceBlock = Prisma.BlockGetPayload<{ include: typeof BLOCK_SUBTREE_INCLUDE }>;
type SourceSession = Prisma.SessionGetPayload<{ include: typeof SESSION_SUBTREE_INCLUDE }>;

const requireMapped = (map: Map<string, string>, key: string): string => {
  const mapped = map.get(key);

  if (mapped === undefined) {
    throw new InternalServerError("Group remap key not found during clone", { key });
  }

  return mapped;
};

const resolveMemberGroup = (map: Map<string, string>, sourceId: string | null): string | null =>
  sourceId === null ? null : requireMapped(map, sourceId);

export const deepCloneRow = async (
  tx: TxClient,
  source: SourceRow,
  schemaId: string,
  order: number,
  rowGroupId: string | null,
): Promise<string> => {
  const created = await tx.schemaRow.create({
    data: {
      schemaId,
      rowGroupId,
      order,
      exerciseId: source.exerciseId,
      sets: source.sets,
      load: marshalNullableJson(source.load),
      reps: marshalNullableJson(source.reps),
      side: marshalNullableJson(source.side),
      tempo: marshalNullableJson(source.tempo),
      media: marshalNullableJson(source.media),
      notes: marshalNullableJson(source.notes),
    },
  });

  if (source.modifierAssignments.length > 0) {
    await tx.rowModifierAssignment.createMany({
      data: source.modifierAssignments.map((assignment) => ({
        rowId: created.id,
        modifierId: assignment.modifierId,
        order: assignment.order,
      })),
    });
  }

  return created.id;
};

const cloneRowGroups = async (
  tx: TxClient,
  source: SourceSchema,
  schemaId: string,
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();

  for (const group of source.rowGroups) {
    const created = await tx.rowGroup.create({
      data: { schemaId, notes: marshalNullableJson(group.notes) },
    });

    map.set(group.id, created.id);
  }

  return map;
};

const witnessRowGroups = async (
  tx: TxClient,
  schemaId: string,
  rowGroupIds: Iterable<string>,
): Promise<void> => {
  const rows = await tx.schemaRow.findMany({
    where: { schemaId },
    select: { id: true, rowGroupId: true, order: true },
  });

  for (const rowGroupId of rowGroupIds) {
    assertRowGroupMembersContiguous(rows, rowGroupId);
  }
};

export const deepCloneSchema = async (
  tx: TxClient,
  source: SourceSchema,
  blockId: string,
  order: number,
  groupId: string | null,
): Promise<string> => {
  const created = await tx.schema.create({
    data: {
      blockId,
      groupId,
      order,
      header: source.header,
      composition: marshalNullableJson(source.composition),
      intensity: marshalNullableJson(source.intensity),
      notes: marshalNullableJson(source.notes),
    },
  });

  const rowGroupMap = await cloneRowGroups(tx, source, created.id);

  for (const [index, row] of source.rows.entries()) {
    await deepCloneRow(
      tx,
      row,
      created.id,
      (index + 1) * ORDER_STEP,
      resolveMemberGroup(rowGroupMap, row.rowGroupId),
    );
  }

  await witnessRowGroups(tx, created.id, rowGroupMap.values());

  return created.id;
};

const cloneSchemaGroups = async (
  tx: TxClient,
  source: SourceBlock,
  blockId: string,
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();

  for (const group of source.groups) {
    const created = await tx.schemaGroup.create({
      data: {
        blockId,
        notes: marshalNullableJson(group.notes),
        interleaveOrder: group.interleaveOrder,
      },
    });

    map.set(group.id, created.id);
  }

  return map;
};

const witnessSchemaGroups = async (
  tx: TxClient,
  blockId: string,
  groupIds: Iterable<string>,
): Promise<void> => {
  const schemas = await tx.schema.findMany({
    where: { blockId },
    select: { id: true, groupId: true, order: true },
  });

  for (const groupId of groupIds) {
    assertGroupMembersContiguous(schemas, groupId);
  }
};

export const deepCloneBlock = async (
  tx: TxClient,
  source: SourceBlock,
  sessionId: string,
  order: number,
): Promise<string> => {
  const created = await tx.block.create({
    data: { sessionId, order, notes: marshalNullableJson(source.notes) },
  });

  if (source.labelAssignments.length > 0) {
    await tx.blockLabelAssignment.createMany({
      data: source.labelAssignments.map((assignment) => ({
        blockId: created.id,
        labelId: assignment.labelId,
        order: assignment.order,
      })),
    });
  }

  const groupMap = await cloneSchemaGroups(tx, source, created.id);

  for (const [index, schema] of source.schemas.entries()) {
    await deepCloneSchema(
      tx,
      schema,
      created.id,
      (index + 1) * ORDER_STEP,
      resolveMemberGroup(groupMap, schema.groupId),
    );
  }

  await witnessSchemaGroups(tx, created.id, groupMap.values());

  return created.id;
};

export const deepCloneSession = async (
  tx: TxClient,
  source: SourceSession,
  dayId: string,
  order: number,
): Promise<string> => {
  const created = await tx.session.create({
    data: { dayId, order, labelId: source.labelId, notes: marshalNullableJson(source.notes) },
  });

  for (const [index, block] of source.blocks.entries()) {
    await deepCloneBlock(tx, block, created.id, (index + 1) * ORDER_STEP);
  }

  return created.id;
};

export const deepCloneSessionsInto = async (
  tx: TxClient,
  sources: SourceSession[],
  targetDayId: string,
): Promise<void> => {
  for (const [index, source] of sources.entries()) {
    await deepCloneSession(tx, source, targetDayId, (index + 1) * ORDER_STEP);
  }
};
