import { type PublishDayResult } from "@repo/contracts/coaching/mobile-publish";
import { type ExerciseById } from "@repo/contracts/lms/row-text";
import { ConflictError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import {
  type LegacyGeneralProgram,
  type LegacyGeneralProgramWriteInput,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";
import { contentHash, toUtcDateParam } from "../../../utils";
import { sessionAbsoluteDateFromParts } from "../../lms/_shared";

import { type MobilePublishDayPayload } from "./day-include";
import { decidePublishAction, type PublishAction } from "./decide-publish-action";
import { projectDay } from "./projection/project-day";

type WriteOutcome = { row: LegacyGeneralProgram; action: PublishAction };

export type PublishDayArgs = {
  legacyClient: LegacyMobileClientPort;
  token: string;
  linkId: string;
  legacyLevelId: number;
  weekStartDate: Date;
  day: MobilePublishDayPayload;
  exerciseById: ExerciseById;
  overwriteUnowned: boolean;
};

const toWriteInput = (
  legacyLevelId: number,
  scheduledDate: string,
  projected: ReturnType<typeof projectDay>,
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

const postLegacyRow = async (
  args: PublishDayArgs,
  scheduledDate: string,
  input: LegacyGeneralProgramWriteInput,
): Promise<WriteOutcome> => {
  try {
    const row = await args.legacyClient.createGeneralProgram(args.token, input);

    return { row, action: "created" };
  } catch (error) {
    if (!(error instanceof ConflictError)) {
      throw error;
    }

    const raced = await args.legacyClient.getGeneralProgram(
      args.token,
      args.legacyLevelId,
      scheduledDate,
    );

    if (raced === null) {
      throw new ConflictError("Legacy program conflict could not be resolved", { scheduledDate });
    }

    return putLegacyRow(args, input, raced.id);
  }
};

const executeWrite = (
  args: PublishDayArgs,
  write: "POST" | "PUT",
  scheduledDate: string,
  input: LegacyGeneralProgramWriteInput,
  legacyRow: LegacyGeneralProgram | null,
): Promise<WriteOutcome> =>
  write === "PUT" && legacyRow !== null
    ? putLegacyRow(args, input, legacyRow.id)
    : postLegacyRow(args, scheduledDate, input);

export const publishDay = async (args: PublishDayArgs): Promise<PublishDayResult> => {
  const absoluteDate = sessionAbsoluteDateFromParts(args.weekStartDate, args.day.dayOfWeek);
  const scheduledDate = toUtcDateParam(absoluteDate);
  const projected = projectDay(args.day, args.exerciseById);
  const hash = contentHash(projected);

  const existingRecord = await prisma.mobilePublishedDay.findUnique({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: absoluteDate } },
    select: { contentHash: true },
  });
  const legacyRow = await args.legacyClient.getGeneralProgram(
    args.token,
    args.legacyLevelId,
    scheduledDate,
  );

  const decision = decidePublishAction({
    existingRecord,
    legacyRow,
    hash,
    overwriteUnowned: args.overwriteUnowned,
  });

  if (decision.write === "none") {
    if (decision.action === "conflict") {
      logger.warn("mobile.publish.conflict", { linkId: args.linkId, scheduledDate });
    }

    return { scheduledDate, action: decision.action, legacyRowId: legacyRow?.id ?? null };
  }

  const input = toWriteInput(args.legacyLevelId, scheduledDate, projected);
  const outcome = await executeWrite(args, decision.write, scheduledDate, input, legacyRow);

  await prisma.mobilePublishedDay.upsert({
    where: { linkId_scheduledDate: { linkId: args.linkId, scheduledDate: absoluteDate } },
    create: {
      linkId: args.linkId,
      scheduledDate: absoluteDate,
      legacyRowId: outcome.row.id,
      contentHash: hash,
    },
    update: { legacyRowId: outcome.row.id, contentHash: hash, publishedAt: new Date() },
  });

  logger.info("mobile.publish.day", {
    linkId: args.linkId,
    scheduledDate,
    action: outcome.action,
    legacyRowId: outcome.row.id,
  });

  return { scheduledDate, action: outcome.action, legacyRowId: outcome.row.id };
};
