import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import {
  type CanonicalBlock,
  type CanonicalSeed,
  type CanonicalSession,
} from "../plan-data/canonical-schema";

import { phase7WeekIndex, stampPhase7ExamplesOrder } from "./phase7-helpers";
import { buildSessionKey, type SessionRefMap } from "./plan-emit";
import { type RefResolver } from "./ref-resolver";

export type BlockRefMap = Map<string, string>;

export const buildBlockKey = (
  weekIndex: number,
  dayOfWeek: string,
  sessionOrder: number,
  blockOrder: number,
): string => `${weekIndex}|${dayOfWeek}|${sessionOrder}|${blockOrder}`;

type BlockEmitContext = {
  db: PrismaClient;
  sessionRefs: SessionRefMap;
  resolver: RefResolver;
  blockRefs: BlockRefMap;
};

const buildLabelAssignmentData = (
  block: CanonicalBlock,
  resolver: RefResolver,
): ReadonlyArray<{ labelId: string; order: number }> =>
  block.labels.map((labelRef, index) => ({
    labelId: resolver.getLabel(labelRef),
    order: index + 1,
  }));

const emitOneBlock = async (
  ctx: BlockEmitContext,
  block: CanonicalBlock,
  sessionId: string,
  blockKey: string,
): Promise<void> => {
  const labelAssignmentData = buildLabelAssignmentData(block, ctx.resolver);
  const created = await ctx.db.block.create({
    data: {
      sessionId,
      order: block.order,
      ...(block.notes !== null && { notes: block.notes }),
      labelAssignments: { create: [...labelAssignmentData] },
    },
  });

  const blockId = requireId(created);

  ctx.blockRefs.set(blockKey, blockId);
};

const emitSessionBlocks = async (
  ctx: BlockEmitContext,
  weekIndex: number,
  dayOfWeek: Parameters<typeof buildSessionKey>[1],
  session: CanonicalSession,
): Promise<void> => {
  const sessionKey = buildSessionKey(weekIndex, dayOfWeek, session.order);
  const sessionId = ctx.sessionRefs.get(sessionKey);

  if (sessionId === undefined) {
    throw new Error(
      `block-emit: session not found for key "${sessionKey}" — plan-emit did not register this session`,
    );
  }

  for (const block of session.blocks) {
    const blockKey = buildBlockKey(weekIndex, dayOfWeek, session.order, block.order);

    await emitOneBlock(ctx, block, sessionId, blockKey);
  }
};

const emitSheetWeeksBlocks = async (ctx: BlockEmitContext, seed: CanonicalSeed): Promise<void> => {
  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        await emitSessionBlocks(ctx, week.weekIndex, day.dayOfWeek, session);
      }
    }
  }
};

const emitPhase7Blocks = async (ctx: BlockEmitContext, seed: CanonicalSeed): Promise<void> => {
  if (seed.phase7Examples.length === 0) {
    return;
  }

  const weekIndex = phase7WeekIndex(seed);
  const stamped = stampPhase7ExamplesOrder(seed.phase7Examples);

  for (const example of stamped) {
    await emitSessionBlocks(ctx, weekIndex, example.dayOfWeek, example);
  }
};

export const seedCanonicalBlocks = async (
  db: PrismaClient,
  seed: CanonicalSeed,
  sessionRefs: SessionRefMap,
  resolver: RefResolver,
): Promise<{ blockRefs: BlockRefMap }> => {
  const blockRefs: BlockRefMap = new Map();
  const ctx: BlockEmitContext = { db, sessionRefs, resolver, blockRefs };

  await emitSheetWeeksBlocks(ctx, seed);
  await emitPhase7Blocks(ctx, seed);

  console.log(`  plan blocks: ${blockRefs.size} blocks`);

  return { blockRefs };
};
