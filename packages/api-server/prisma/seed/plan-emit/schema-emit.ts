import { type PrismaClient } from "@prisma/client";

import { DEFAULT_INTERLEAVE_ORDER } from "@repo/contracts/lms/schema-group";

import { requireId } from "../_id-helpers";
import {
  type CanonicalBlock,
  type CanonicalGroupItem,
  type CanonicalRow,
  type CanonicalRowGroup,
  type CanonicalSchemaNode,
  type CanonicalSeed,
  isCanonicalGroupItem,
} from "../plan-data/canonical-schema";

import { type BlockRefMap, buildBlockKey } from "./block-emit";
import { phase7WeekIndex, stampPhase7ExamplesOrder } from "./phase7-helpers";
import { type RefResolver } from "./ref-resolver";

type SchemaEmitContext = {
  db: PrismaClient;
  resolver: RefResolver;
};

const emitSchemaRow = async (
  ctx: SchemaEmitContext,
  schemaId: string,
  row: CanonicalRow,
): Promise<string> => {
  const created = await ctx.db.schemaRow.create({
    data: {
      schemaId,
      order: row.order,
      exerciseId: ctx.resolver.getExercise(row.exerciseId),
      ...(row.sets !== null && { sets: row.sets }),
      ...(row.load !== null && { load: row.load }),
      ...(row.reps !== null && { reps: row.reps }),
      ...(row.side !== null && { side: row.side }),
      ...(row.tempo !== null && { tempo: row.tempo }),
      ...(row.media !== null && { media: row.media }),
      ...(row.notes !== null && { notes: row.notes }),
    },
  });

  const rowId = requireId(created);

  if (row.modifierRefs.length > 0) {
    await ctx.db.rowModifierAssignment.createMany({
      data: row.modifierRefs.map((ref, index) => ({
        rowId,
        modifierId: ctx.resolver.getModifier(ref),
        order: index,
      })),
    });
  }

  return rowId;
};

const emitRowGroup = async (
  ctx: SchemaEmitContext,
  schemaId: string,
  rowIdsByRef: ReadonlyMap<string, string>,
  rowGroup: CanonicalRowGroup,
): Promise<void> => {
  const created = await ctx.db.rowGroup.create({
    data: {
      schemaId,
      ...(rowGroup.notes !== null && { notes: rowGroup.notes }),
    },
  });

  const rowGroupId = requireId(created);
  const memberIds = rowGroup.memberRowRefIds.map((refId) => {
    const id = rowIdsByRef.get(refId);

    if (id === undefined) {
      throw new Error(
        `schema-emit: row-group "${rowGroup.refId}" references unknown row refId "${refId}" — member rows must declare a matching refId within the same schema node`,
      );
    }

    return id;
  });

  await ctx.db.schemaRow.updateMany({
    where: { id: { in: memberIds } },
    data: { rowGroupId },
  });
};

const emitSchemaNode = async (
  ctx: SchemaEmitContext,
  blockId: string,
  groupId: string | null,
  order: number,
  node: CanonicalSchemaNode,
): Promise<void> => {
  const created = await ctx.db.schema.create({
    data: {
      blockId,
      groupId,
      order,
      header: node.header,
      ...(node.intensity !== null && { intensity: node.intensity }),
      composition: node.composition,
      ...(node.notes !== null && { notes: node.notes }),
    },
  });

  const schemaId = requireId(created);
  const rowIdsByRef = new Map<string, string>();

  for (const row of node.rows) {
    const rowId = await emitSchemaRow(ctx, schemaId, row);

    if (row.refId !== undefined) {
      rowIdsByRef.set(row.refId, rowId);
    }
  }

  for (const rowGroup of node.rowGroups) {
    await emitRowGroup(ctx, schemaId, rowIdsByRef, rowGroup);
  }
};

const emitGroup = async (
  ctx: SchemaEmitContext,
  blockId: string,
  startOrder: number,
  item: CanonicalGroupItem,
): Promise<number> => {
  const group = await ctx.db.schemaGroup.create({
    data: {
      blockId,
      ...(item.group.notes !== null && { notes: item.group.notes }),
      interleaveOrder: item.group.interleaveOrder ?? DEFAULT_INTERLEAVE_ORDER,
    },
  });

  const groupId = requireId(group);
  let order = startOrder;

  for (const member of item.group.members) {
    await emitSchemaNode(ctx, blockId, groupId, order, member);
    order += 1;
  }

  return order;
};

const assertUniqueBlockItemOrders = (block: CanonicalBlock, blockKey: string): void => {
  const seen = new Set<number>();

  for (const item of block.schemas) {
    const orders = isCanonicalGroupItem(item)
      ? item.group.members.map((member) => member.order)
      : [item.order];

    for (const order of orders) {
      if (seen.has(order)) {
        throw new Error(`schema-emit: duplicate schema order ${order} within block "${blockKey}"`);
      }

      seen.add(order);
    }
  }
};

const emitBlockSchemas = async (
  ctx: SchemaEmitContext,
  block: CanonicalBlock,
  blockId: string,
  blockKey: string,
): Promise<void> => {
  assertUniqueBlockItemOrders(block, blockKey);

  ctx.resolver.enterBlock(blockKey);

  let order = 1;

  for (const item of block.schemas) {
    if (isCanonicalGroupItem(item)) {
      order = await emitGroup(ctx, blockId, order, item);
    } else {
      await emitSchemaNode(ctx, blockId, null, order, item);
      order += 1;
    }
  }

  ctx.resolver.exitBlock();
};

const countBlockSchemas = (block: CanonicalBlock): number =>
  block.schemas.reduce(
    (total, item) => total + (isCanonicalGroupItem(item) ? item.group.members.length : 1),
    0,
  );

const requireBlockId = (blockRefs: BlockRefMap, blockKey: string): string => {
  const id = blockRefs.get(blockKey);

  if (id === undefined) {
    throw new Error(
      `schema-emit: blockId not found for key "${blockKey}" — block-emit did not register this block`,
    );
  }

  return id;
};

const emitSheetWeeksSchemas = async (
  ctx: SchemaEmitContext,
  seed: CanonicalSeed,
  blockRefs: BlockRefMap,
): Promise<number> => {
  let schemaCount = 0;

  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const blockKey = buildBlockKey(week.weekIndex, day.dayOfWeek, session.order, block.order);
          const blockId = requireBlockId(blockRefs, blockKey);

          await emitBlockSchemas(ctx, block, blockId, blockKey);
          schemaCount += countBlockSchemas(block);
        }
      }
    }
  }

  return schemaCount;
};

const emitPhase7Schemas = async (
  ctx: SchemaEmitContext,
  seed: CanonicalSeed,
  blockRefs: BlockRefMap,
): Promise<number> => {
  if (seed.phase7Examples.length === 0) {
    return 0;
  }

  const weekIndex = phase7WeekIndex(seed);
  const stamped = stampPhase7ExamplesOrder(seed.phase7Examples);
  let schemaCount = 0;

  for (const example of stamped) {
    for (const block of example.blocks) {
      const blockKey = buildBlockKey(weekIndex, example.dayOfWeek, example.order, block.order);
      const blockId = requireBlockId(blockRefs, blockKey);

      await emitBlockSchemas(ctx, block, blockId, blockKey);
      schemaCount += countBlockSchemas(block);
    }
  }

  return schemaCount;
};

export const seedCanonicalSchemas = async (
  db: PrismaClient,
  seed: CanonicalSeed,
  blockRefs: BlockRefMap,
  resolver: RefResolver,
): Promise<{ schemaCount: number }> => {
  const ctx: SchemaEmitContext = { db, resolver };
  const sheetCount = await emitSheetWeeksSchemas(ctx, seed, blockRefs);
  const phase7Count = await emitPhase7Schemas(ctx, seed, blockRefs);
  const schemaCount = sheetCount + phase7Count;

  console.log(`  plan schemas: ${schemaCount} flat schemas (members grouped via SchemaGroup)`);

  return { schemaCount };
};
