import { type PublishDayResult } from "@repo/contracts/coaching/mobile-publish";
import { type ExerciseById } from "@repo/contracts/lms/row-text";
import { ConflictError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import {
  type LegacyDailyProgram,
  type LegacyGeneralProgram,
  type LegacyGeneralProgramWriteInput,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";
import { contentHash } from "../../../utils";

import { type MobilePublishDayPayload } from "./day-include";
import {
  decidePublishAction,
  type PublishAction,
  type PublishDecision,
} from "./decide-publish-action";
import { type LegacyDailyProgramResult, projectDay } from "./projection/project-day";

type WriteOutcome = { row: LegacyGeneralProgram; action: PublishAction };

type Hashable = { isRestDay: true } | { isRestDay: false; dailyProgram: LegacyDailyProgram | null };

export type PublishDayArgs = {
  legacyClient: LegacyMobileClientPort;
  token: string;
  linkId: string;
  legacyLevelId: number;
  scheduledDate: string;
  absoluteDate: Date;
  day: MobilePublishDayPayload;
  exerciseById: ExerciseById;
  overwriteUnowned: boolean;
};

const toHashable = (isRestDay: boolean, dailyProgram: LegacyDailyProgram | null): Hashable =>
  isRestDay ? { isRestDay: true } : { isRestDay: false, dailyProgram };

const toWriteInput = (
  legacyLevelId: number,
  scheduledDate: string,
  projected: LegacyDailyProgramResult,
): LegacyGeneralProgramWriteInput => ({
  levelId: legacyLevelId,
  scheduledDate,
  isRestDay: projected.isRestDay,
  dailyProgram: projected.isRestDay ? null : projected.dailyProgram,
});

const putLegacyRow = async (
  args: PublishDayArgs,
  input: LegacyGeneralProgramWriteInput,
  legacyRowId: number,
): Promise<WriteOutcome> => {
  const row = await args.legacyClient.updateGeneralProgram(args.token, {
    ...input,
    id: legacyRowId,
  });

  return { row, action: "updated" };
};

const resolveRace = async (
  args: PublishDayArgs,
  input: LegacyGeneralProgramWriteInput,
  hash: string,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> => {
  const raced = await args.legacyClient.getGeneralProgram(
    args.token,
    args.legacyLevelId,
    args.scheduledDate,
  );

  if (raced === null) {
    throw new ConflictError("Legacy program conflict could not be resolved", {
      scheduledDate: args.scheduledDate,
    });
  }

  const decision = decidePublishAction({
    isOwned,
    hasLegacyRow: true,
    contentMatches: hash === contentHash(toHashable(raced.isRestDay, raced.dailyProgram)),
    overwriteUnowned: args.overwriteUnowned,
  });

  if (decision.write === "PUT") {
    return putLegacyRow(args, input, raced.id);
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
  input: LegacyGeneralProgramWriteInput,
  hash: string,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> => {
  try {
    const row = await args.legacyClient.createGeneralProgram(args.token, input);

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
  legacyRowId: number,
  hash: string,
): Promise<void> => {
  await prisma.mobilePublishedDay.upsert({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: args.absoluteDate } },
    create: {
      linkId: args.linkId,
      scheduledDate: args.absoluteDate,
      legacyRowId,
      contentHash: hash,
    },
    update: { legacyRowId, contentHash: hash, publishedAt: new Date() },
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
  input: LegacyGeneralProgramWriteInput,
  hash: string,
  legacyRow: LegacyGeneralProgram | null,
  isOwned: boolean,
): Promise<WriteOutcome | PublishDayResult> =>
  write === "PUT" && legacyRow !== null
    ? putLegacyRow(args, input, legacyRow.id)
    : postLegacyRow(args, input, hash, isOwned);

export const publishDay = async (args: PublishDayArgs): Promise<PublishDayResult> => {
  const projected = projectDay(args.day, args.exerciseById);
  const hash = contentHash(projected);

  const existingRecord = await prisma.mobilePublishedDay.findUnique({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: args.absoluteDate } },
    select: { id: true },
  });
  const legacyRow = await args.legacyClient.getGeneralProgram(
    args.token,
    args.legacyLevelId,
    args.scheduledDate,
  );

  const isOwned = existingRecord !== null;
  const decision = decidePublishAction({
    isOwned,
    hasLegacyRow: legacyRow !== null,
    contentMatches:
      legacyRow !== null &&
      hash === contentHash(toHashable(legacyRow.isRestDay, legacyRow.dailyProgram)),
    overwriteUnowned: args.overwriteUnowned,
  });

  if (decision.write === "none") {
    return noWriteResult(args, decision, legacyRow?.id ?? null);
  }

  const input = toWriteInput(args.legacyLevelId, args.scheduledDate, projected);
  const outcome = await executeWrite(args, decision.write, input, hash, legacyRow, isOwned);

  if (!isWriteOutcome(outcome)) {
    return outcome;
  }

  await recordPublishedDay(args, outcome.row.id, hash);

  logger.info("mobile.publish.day", {
    linkId: args.linkId,
    scheduledDate: args.scheduledDate,
    action: outcome.action,
    legacyRowId: outcome.row.id,
  });

  return { scheduledDate: args.scheduledDate, action: outcome.action, legacyRowId: outcome.row.id };
};
