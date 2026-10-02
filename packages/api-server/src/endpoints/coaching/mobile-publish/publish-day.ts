import { Prisma } from "@prisma/client";

import { type PublishDayResult } from "@repo/contracts/coaching/mobile-publish";
import { type ExerciseById } from "@repo/contracts/lms/row-text";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import { toInputJson } from "../../../utils";

import { dayContentHash } from "./day-content-hash";
import { type MobilePublishDayPayload } from "./day-include";
import {
  decidePublishAction,
  type PublishAction,
  type PublishedDayState,
} from "./decide-publish-action";
import { type LegacyDailyProgramResult, projectDay } from "./projection/project-day";

export type PublishDayArgs = {
  linkId: string;
  scheduledDate: string;
  absoluteDate: Date;
  day: MobilePublishDayPayload;
  exerciseById: ExerciseById;
};

type DayWrite = {
  args: PublishDayArgs;
  projected: LegacyDailyProgramResult;
  hash: string;
};

type DayOutcome = { action: PublishAction; legacyRowId: number };

const UNIQUE_VIOLATION = "P2002";

const dayKey = (args: PublishDayArgs) => ({
  linkId_scheduledDate: { linkId: args.linkId, scheduledDate: args.absoluteDate },
});

const toSnapshotContent = (projected: LegacyDailyProgramResult) =>
  projected.isRestDay
    ? { isRestDay: true, dailyProgram: Prisma.DbNull }
    : { isRestDay: false, dailyProgram: toInputJson(projected.dailyProgram) };

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION;

const loadStoredDay = (args: PublishDayArgs) =>
  prisma.mobilePublishedDay.findUnique({
    where: dayKey(args),
    select: { legacyRowId: true, contentHash: true, isRestDay: true },
  });

type StoredDay = NonNullable<Awaited<ReturnType<typeof loadStoredDay>>>;

const updateDay = async (write: DayWrite): Promise<DayOutcome> => {
  const row = await prisma.mobilePublishedDay.update({
    where: dayKey(write.args),
    data: {
      contentHash: write.hash,
      publishedAt: new Date(),
      ...toSnapshotContent(write.projected),
    },
    select: { legacyRowId: true },
  });

  return { action: "updated", legacyRowId: row.legacyRowId };
};

const toDayState = (stored: StoredDay | null): PublishedDayState | null =>
  stored === null
    ? null
    : { contentHash: stored.contentHash, hasContent: stored.isRestDay !== null };

const resolveConcurrentInsert = async (write: DayWrite): Promise<DayOutcome> => {
  const stored = await loadStoredDay(write.args);

  if (stored === null) {
    throw new InternalServerError("Published day vanished after a concurrent insert", {
      linkId: write.args.linkId,
      scheduledDate: write.args.scheduledDate,
    });
  }

  return writeDecided(write, stored);
};

const createDay = async (write: DayWrite): Promise<DayOutcome> => {
  try {
    const row = await prisma.mobilePublishedDay.create({
      data: {
        linkId: write.args.linkId,
        scheduledDate: write.args.absoluteDate,
        contentHash: write.hash,
        ...toSnapshotContent(write.projected),
      },
      select: { legacyRowId: true },
    });

    return { action: "created", legacyRowId: row.legacyRowId };
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    return resolveConcurrentInsert(write);
  }
};

const writeDecided = async (write: DayWrite, stored: StoredDay | null): Promise<DayOutcome> => {
  const action = decidePublishAction(toDayState(stored), write.hash);

  if (stored === null || action === "created") {
    return createDay(write);
  }

  if (action === "skipped") {
    return { action, legacyRowId: stored.legacyRowId };
  }

  return updateDay(write);
};

export const publishDay = async (args: PublishDayArgs): Promise<PublishDayResult> => {
  const projected = projectDay(args.day, args.exerciseById);
  const write: DayWrite = { args, projected, hash: dayContentHash(projected) };

  const outcome = await writeDecided(write, await loadStoredDay(args));

  if (outcome.action !== "skipped") {
    logger.info("mobile.publish.day", {
      linkId: args.linkId,
      scheduledDate: args.scheduledDate,
      action: outcome.action,
      legacyRowId: outcome.legacyRowId,
    });
  }

  return { scheduledDate: args.scheduledDate, ...outcome };
};
