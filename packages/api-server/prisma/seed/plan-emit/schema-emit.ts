import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import {
  type CanonicalBlock,
  type CanonicalRow,
  type CanonicalSchemaNode,
  type CanonicalSeed,
} from "../plan-data/canonical-schema";

import { type BlockRefMap, buildBlockKey } from "./block-emit";
import { phase7WeekIndex, stampPhase7ExamplesOrder } from "./phase7-helpers";
import { type RefResolver } from "./ref-resolver";
import { arrangementHasRefs, backPatchComposition } from "./schema-emit-back-patch";

type SchemaEmitContext = {
  db: PrismaClient;
  resolver: RefResolver;
};

const emitSchemaRow = async (
  ctx: SchemaEmitContext,
  schemaId: string,
  row: CanonicalRow,
): Promise<void> => {
  const created = await ctx.db.schemaRow.create({
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
      ...(row.compoundRep !== null && { compoundRep: row.compoundRep }),
      notes: row.notes,
    },
  });

  if (row.refId !== undefined) {
    ctx.resolver.setRow(row.refId, requireId(created));
  }
};

const stripArrangement = (
  composition: CanonicalSchemaNode["composition"],
): CanonicalSchemaNode["composition"] => ({
  ...(composition.repetition !== undefined && { repetition: composition.repetition }),
  ...(composition.rest !== undefined && { rest: composition.rest }),
});

const emitSchemaNode = async (
  ctx: SchemaEmitContext,
  blockId: string,
  parentSchemaId: string | null,
  node: CanonicalSchemaNode,
): Promise<void> => {
  const needsBackPatch = arrangementHasRefs(node.composition.arrangement);

  const created = await ctx.db.schema.create({
    data: {
      blockId,
      parentSchemaId,
      order: node.order,
      header: node.header,
      ...(node.intensity !== null && { intensity: node.intensity }),
      composition: needsBackPatch ? stripArrangement(node.composition) : node.composition,
      notes: node.notes,
    },
  });

  const schemaId = requireId(created);

  if (node.refId !== undefined) {
    ctx.resolver.setSchema(node.refId, schemaId);
  }

  for (const row of node.rows) {
    await emitSchemaRow(ctx, schemaId, row);
  }

  for (const sub of node.subSchemas) {
    await emitSchemaNode(ctx, blockId, schemaId, sub);
  }

  if (needsBackPatch) {
    await backPatchComposition(ctx.db, schemaId, node.composition, ctx.resolver);
  }
};

const collectReferencedRefs = (
  schemas: readonly CanonicalSchemaNode[],
  rowRefs: Set<string> = new Set(),
): Set<string> => {
  for (const schema of schemas) {
    const { arrangement } = schema.composition;

    if (arrangement?.kind === "superset") {
      for (const pair of arrangement.pairs) {
        for (const rowRef of pair.rowIds) {
          rowRefs.add(rowRef);
        }
      }
    }

    collectReferencedRefs(schema.subSchemas, rowRefs);
  }

  return rowRefs;
};

const assertUniqueTopLevelOrders = (block: CanonicalBlock, blockKey: string): void => {
  const seen = new Set<number>();

  for (const schema of block.schemas) {
    if (seen.has(schema.order)) {
      throw new Error(
        `schema-emit: duplicate top-level schema order ${schema.order} within block "${blockKey}" — Postgres @@unique([parentSchemaId, order]) does not enforce uniqueness when parentSchemaId is NULL`,
      );
    }

    seen.add(schema.order);
  }
};

const emitBlockSchemas = async (
  ctx: SchemaEmitContext,
  block: CanonicalBlock,
  blockId: string,
  blockKey: string,
): Promise<void> => {
  assertUniqueTopLevelOrders(block, blockKey);

  const rowRefs = collectReferencedRefs(block.schemas);

  ctx.resolver.enterBlock(blockKey, rowRefs);

  for (const schema of block.schemas) {
    await emitSchemaNode(ctx, blockId, null, schema);
  }

  ctx.resolver.exitBlock();
};

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
          schemaCount += block.schemas.length;
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
      schemaCount += block.schemas.length;
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

  console.log(
    `  plan schemas: ${schemaCount} top-level schemas (recursive sub-schemas not counted)`,
  );

  return { schemaCount };
};
