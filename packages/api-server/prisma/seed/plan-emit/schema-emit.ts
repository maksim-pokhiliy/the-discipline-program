import { type PrismaClient } from "@prisma/client";

import { DEFAULT_INTERLEAVE_ORDER } from "@repo/contracts/lms/schema-group";

import { requireId } from "../_id-helpers";
import {
  type CanonicalBlock,
  type CanonicalGroupItem,
  type CanonicalRow,
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
): Promise<void> => {
  await ctx.db.schemaRow.create({
    data: {
      schemaId,
      order: row.order,
      rowKind: row.rowKind,
      rowPayload: row.rowPayload,
      ...(row.load !== null && { load: row.load }),
      ...(row.reps !== null && { reps: row.reps }),
      ...(row.side !== null && { side: row.side }),
      ...(row.tempo !== null && { tempo: row.tempo }),
      position: row.position,
      ...(row.sequence !== null && { sequence: row.sequence }),
      ...(row.intensity !== null && { intensity: row.intensity }),
      ...(row.media !== null && { media: row.media }),
      notes: row.notes,
    },
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
      notes: node.notes,
    },
  });

  const schemaId = requireId(created);

  for (const row of node.rows) {
    await emitSchemaRow(ctx, schemaId, row);
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
      label: item.group.label,
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
