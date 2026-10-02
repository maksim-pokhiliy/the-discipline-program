import { Prisma } from "@prisma/client";

import {
  type PublishDayResult,
  type PublishMobileData,
  type PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";
import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { AppError } from "@repo/errors";
import { logger } from "@repo/shared";

import { verifyMobileLinkOwnership } from "../../../authz/guards";
import { toUtcDateParam } from "../../../utils";
import { resolveWeekStartDate, sessionAbsoluteDateFromParts } from "../../lms/_shared";

import { type MobilePublishDayPayload } from "./day-include";
import { publishDay } from "./publish-day";
import { loadExerciseById, loadTargetDays } from "./publish-loaders";

export type PublishApi = {
  publish(userId: string, data: PublishMobileData): Promise<PublishMobileResult>;
};

const resolveFailureCode = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.code;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  return error instanceof Error ? error.name : "unknown";
};

const sortDaysByDate = (
  days: MobilePublishDayPayload[],
  weekStartDate: Date,
): MobilePublishDayPayload[] =>
  [...days].sort(
    (a, b) =>
      sessionAbsoluteDateFromParts(weekStartDate, a.dayOfWeek).getTime() -
      sessionAbsoluteDateFromParts(weekStartDate, b.dayOfWeek).getTime(),
  );

export const createPublishApi = (): PublishApi => ({
  publish: async (userId, data) => {
    const { planId } = await verifyMobileLinkOwnership(data.linkId, userId);
    const weekStartDate = resolveWeekStartDate(data.startDate);
    const dayOfWeek: DayOfWeek | undefined = data.scope === "day" ? data.dayOfWeek : undefined;
    const days = sortDaysByDate(
      await loadTargetDays(planId, weekStartDate, dayOfWeek),
      weekStartDate,
    );
    const exerciseById = await loadExerciseById(days);

    const results: PublishDayResult[] = [];

    for (const day of days) {
      const absoluteDate = sessionAbsoluteDateFromParts(weekStartDate, day.dayOfWeek);
      const scheduledDate = toUtcDateParam(absoluteDate);

      try {
        results.push(
          await publishDay({
            linkId: data.linkId,
            scheduledDate,
            absoluteDate,
            day,
            exerciseById,
          }),
        );
      } catch (error) {
        const code = resolveFailureCode(error);

        logger.warn("mobile.publish.day_failed", { linkId: data.linkId, scheduledDate, code });
        results.push({ scheduledDate, action: "failed", legacyRowId: null });
      }
    }

    return { results };
  },
});
