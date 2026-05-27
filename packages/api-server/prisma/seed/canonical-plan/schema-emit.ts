import { type PrismaClient } from "@prisma/client";

import {
  type CanonicalBlock,
  type CanonicalRow,
  type CanonicalSchemaNode,
  type CanonicalSeed,
} from "../_canonical/canonical-schema";
import { requireId } from "../_id-helpers";

import { type AltGroupRefMap, type BlockRefMap, buildBlockKey } from "./block-emit";
import { phase7WeekIndex, stampPhase7ExamplesOrder } from "./phase7-helpers";
import { type RefResolver } from "./ref-resolver";
import { backPatchSchema, hasRowRefs } from "./schema-emit-back-patch";
import { extractTrailingConnector } from "./trailing-connector";

type SchemaEmitContext = {
  db: PrismaClient;
  archetypeIdByName: ReadonlyMap<string, string>;
  resolver: RefResolver;
};

const requireArchetypeId = (
  archetypeIdByName: ReadonlyMap<string, string>,
  name: string,
): string => {
  const id = archetypeIdByName.get(name);

  if (id === undefined) {
    throw new Error(`schema-emit: archetype "${name}" not found in archetypeIdByName lookup`);
  }

  return id;
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

const emitSchemaNode = async (
  ctx: SchemaEmitContext,
  blockId: string,
  parentSchemaId: string | null,
  node: CanonicalSchemaNode,
): Promise<void> => {
  const { connector, cleanedNotes } = extractTrailingConnector(node.notes);
  const archetypeId = requireArchetypeId(ctx.archetypeIdByName, node.archetype.archetype);
  const alternatingGroupId =
    node.alternatingGroupRef === null ? null : ctx.resolver.getAltGroup(node.alternatingGroupRef);

  const created = await ctx.db.schema.create({
    data: {
      blockId,
      parentSchemaId,
      alternatingGroupId,
      order: node.order,
      kind: node.kind,
      archetypeId,
      header: node.header,
      archetypeParams: node.archetype,
      ...(node.intensity !== null && { intensity: node.intensity }),
      ...(connector !== null && { trailingConnector: connector }),
      notes: cleanedNotes,
    },
  });

  const schemaId = requireId(created);

  for (const row of node.rows) {
    await emitSchemaRow(ctx, schemaId, row);
  }

  for (const sub of node.subSchemas) {
    await emitSchemaNode(ctx, blockId, schemaId, sub);
  }

  if (hasRowRefs(node.archetype)) {
    await backPatchSchema(ctx.db, schemaId, node.archetype, ctx.resolver);
  }
};

const collectReferencedRowRefs = (
  schemas: readonly CanonicalSchemaNode[],
  acc: Set<string> = new Set(),
): Set<string> => {
  for (const schema of schemas) {
    const params = schema.archetype;

    if (
      params.archetype === "parallel-ladders-descending" ||
      params.archetype === "parallel-ladders-mixed-direction"
    ) {
      for (const ladder of params.params.ladders) {
        if (ladder.pairedWithInnerRowId !== undefined) {
          acc.add(ladder.pairedWithInnerRowId);
        }
      }
    } else if (params.archetype === "parallel-pyramids") {
      for (const pyramid of params.params.pyramids) {
        if (pyramid.pairedWithInnerRowId !== undefined) {
          acc.add(pyramid.pairedWithInnerRowId);
        }
      }
    } else if (params.archetype === "super-set") {
      for (const pair of params.params.pairs) {
        for (const rowRef of pair.schemaRows) {
          acc.add(rowRef);
        }
      }
    }

    collectReferencedRowRefs(schema.subSchemas, acc);
  }

  return acc;
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
  altGroupRefs: AltGroupRefMap,
): Promise<void> => {
  assertUniqueTopLevelOrders(block, blockKey);
  ctx.resolver.enterBlock(blockKey, collectReferencedRowRefs(block.schemas));

  const blockAltGroups = altGroupRefs.get(blockKey) ?? new Map<string, string>();

  for (const [ref, id] of blockAltGroups) {
    ctx.resolver.setAltGroup(ref, id);
  }

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
  altGroupRefs: AltGroupRefMap,
): Promise<number> => {
  let schemaCount = 0;

  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const blockKey = buildBlockKey(week.weekIndex, day.dayOfWeek, session.order, block.order);
          const blockId = requireBlockId(blockRefs, blockKey);

          await emitBlockSchemas(ctx, block, blockId, blockKey, altGroupRefs);
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
  altGroupRefs: AltGroupRefMap,
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

      await emitBlockSchemas(ctx, block, blockId, blockKey, altGroupRefs);
      schemaCount += block.schemas.length;
    }
  }

  return schemaCount;
};

export const seedCanonicalSchemas = async (
  db: PrismaClient,
  seed: CanonicalSeed,
  blockRefs: BlockRefMap,
  altGroupRefs: AltGroupRefMap,
  archetypeIdByName: ReadonlyMap<string, string>,
  resolver: RefResolver,
): Promise<{ schemaCount: number }> => {
  const ctx: SchemaEmitContext = { db, archetypeIdByName, resolver };
  const sheetCount = await emitSheetWeeksSchemas(ctx, seed, blockRefs, altGroupRefs);
  const phase7Count = await emitPhase7Schemas(ctx, seed, blockRefs, altGroupRefs);
  const schemaCount = sheetCount + phase7Count;

  console.log(
    `  Demo Plan schemas: ${schemaCount} top-level schemas (recursive sub-schemas not counted)`,
  );

  return { schemaCount };
};
