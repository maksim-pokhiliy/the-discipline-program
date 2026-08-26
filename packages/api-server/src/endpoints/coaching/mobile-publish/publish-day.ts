import { Prisma } from "@prisma/client";

import { type PublishDayResult } from "@repo/contracts/coaching/mobile-publish";
import { type ExerciseById } from "@repo/contracts/lms/row-text";
import { ConflictError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import { toInputJson } from "../../../utils";

import {
  type ChannelProgramOps,
  type LegacyProgramRow,
  type LegacyProgramWriteBody,
} from "./channel-program-ops";
import { dayContentHash, toHashable } from "./day-content-hash";
import { type MobilePublishDayPayload } from "./day-include";
import {
  decidePublishAction,
  type PublishAction,
  type PublishDecision,
} from "./decide-publish-action";
import { type LegacyDailyProgramResult, projectDay } from "./projection/project-day";

type WriteOutcome = { row: LegacyProgramRow; action: PublishAction };

export type PublishDayArgs = {
  ops: ChannelProgramOps;
  linkId: string;
  scheduledDate: string;
  absoluteDate: Date;
  day: MobilePublishDayPayload;
  exerciseById: ExerciseById;
  overwriteUnowned: boolean;
};

const toWriteBody = (
  scheduledDate: string,
  projected: LegacyDailyProgramResult,
): LegacyProgramWriteBody => ({
  scheduledDate,
  isRestDay: projected.isRestDay,
  dailyProgram: projected.isRestDay ? null : projected.dailyProgram,
});

const putLegacyRow = async (
  args: PublishDayArgs,
  input: LegacyProgramWriteBody,
  legacyRowId: number,
): Promise<WriteOutcome> => {
  const row = await args.ops.replaceProgram(input, legacyRowId);

  return { row, action: "updated" };
};

const resolveRace = async (
  args: PublishDayArgs,
  input: LegacyProgramWriteBody,
  hash: string,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> => {
  const raced = await args.ops.getProgram(args.scheduledDate);

  if (raced === null) {
    throw new ConflictError("Legacy program conflict could not be resolved", {
      scheduledDate: args.scheduledDate,
    });
  }

  const decision = decidePublishAction({
    isOwned,
    hasLegacyRow: true,
    contentMatches: hash === dayContentHash(toHashable(raced.isRestDay, raced.dailyProgram)),
    overwriteUnowned: args.overwriteUnowned,
  });

  if (decision.write === "PUT") {
    return putLegacyRow(args, input, raced.id);
  }

  if (decision.action === "skipped" && !isOwned) {
    await recordPublishedDay(args, raced, hash);
  }

  if (decision.action === "conflict") {
    logger.warn("mobile.publish.conflict", {
      linkId: args.linkId,
      scheduledDate: args.scheduledDate,
    });
  }

  return { scheduledDate: args.scheduledDate, action: decision.action, legacyRowId: raced.id };
};

const postLegacyRow = async (
  args: PublishDayArgs,
  input: LegacyProgramWriteBody,
  hash: string,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> => {
  try {
    const row = await args.ops.createProgram(input);

    return { row, action: "created" };
  } catch (error) {
    if (!(error instanceof ConflictError)) {
      throw error;
    }

    return resolveRace(args, input, hash, isOwned);
  }
};

const recordPublishedDay = async (
  args: PublishDayArgs,
  legacyRow: LegacyProgramRow,
  hash: string,
): Promise<void> => {
  const dailyProgram =
    legacyRow.dailyProgram === null ? Prisma.DbNull : toInputJson(legacyRow.dailyProgram);

  await prisma.mobilePublishedDay.upsert({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: args.absoluteDate } },
    create: {
      linkId: args.linkId,
      scheduledDate: args.absoluteDate,
      legacyRowId: legacyRow.id,
      contentHash: hash,
      isRestDay: legacyRow.isRestDay,
      dailyProgram,
    },
    update: {
      legacyRowId: legacyRow.id,
      contentHash: hash,
      publishedAt: new Date(),
      isRestDay: legacyRow.isRestDay,
      dailyProgram,
    },
  });
};

const isWriteOutcome = (value: WriteOutcome | PublishDayResult): value is WriteOutcome =>
  "row" in value;

const noWriteResult = (
  args: PublishDayArgs,
  decision: PublishDecision,
  legacyRowId: number | null,
): PublishDayResult => {
  if (decision.action === "conflict") {
    logger.warn("mobile.publish.conflict", {
      linkId: args.linkId,
      scheduledDate: args.scheduledDate,
    });
  }

  return { scheduledDate: args.scheduledDate, action: decision.action, legacyRowId };
};

const executeWrite = (
  args: PublishDayArgs,
  write: "POST" | "PUT",
  input: LegacyProgramWriteBody,
  hash: string,
  legacyRow: LegacyProgramRow | null,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> =>
  write === "PUT" && legacyRow !== null
    ? putLegacyRow(args, input, legacyRow.id)
    : postLegacyRow(args, input, hash, isOwned);

export const publishDay = async (args: PublishDayArgs): Promise<PublishDayResult> => {
  const projected = projectDay(args.day, args.exerciseById);
  const hash = dayContentHash(projected);

  const existingRecord = await prisma.mobilePublishedDay.findUnique({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: args.absoluteDate } },
    select: { id: true },
  });
  const legacyRow = await args.ops.getProgram(args.scheduledDate);

  const isOwned = existingRecord !== null;
  const decision = decidePublishAction({
    isOwned,
    hasLegacyRow: legacyRow !== null,
    contentMatches:
      legacyRow !== null &&
      hash === dayContentHash(toHashable(legacyRow.isRestDay, legacyRow.dailyProgram)),
    overwriteUnowned: args.overwriteUnowned,
  });

  if (decision.write === "none") {
    if (decision.action === "skipped" && !isOwned && legacyRow !== null) {
      await recordPublishedDay(args, legacyRow, hash);
    }

    return noWriteResult(args, decision, legacyRow?.id ?? null);
  }

  const input = toWriteBody(args.scheduledDate, projected);
  const outcome = await executeWrite(args, decision.write, input, hash, legacyRow, isOwned);

  if (!isWriteOutcome(outcome)) {
    return outcome;
  }

  await recordPublishedDay(args, outcome.row, hash);

  logger.info("mobile.publish.day", {
    linkId: args.linkId,
    scheduledDate: args.scheduledDate,
    action: outcome.action,
    legacyRowId: outcome.row.id,
  });

  return { scheduledDate: args.scheduledDate, action: outcome.action, legacyRowId: outcome.row.id };
};
