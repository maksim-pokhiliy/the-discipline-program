import {
  type PublishDayResult,
  type PublishMobileData,
  type PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";
import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { AppError, NotFoundError, UnauthorizedError } from "@repo/errors";
import { logger } from "@repo/shared";

import { verifyMobileLinkOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { toUtcDateParam } from "../../../utils";
import { decrypt } from "../../../utils/token-cipher";
import { resolveWeekStartDate, sessionAbsoluteDateFromParts } from "../../lms/_shared";

import { type MobilePublishDayPayload } from "./day-include";
import { publishDay } from "./publish-day";
import { loadExerciseById, loadTargetDays } from "./publish-loaders";
import { reconnectRequiredError, tokenUnreadableError } from "./reconnect-signal";

export type PublishApi = {
  publish(userId: string, data: PublishMobileData): Promise<PublishMobileResult>;
};

const loadLink = async (
  linkId: string,
): Promise<{
  planId: string;
  legacyLevelId: number;
  encryptedToken: string;
  expiresAt: Date;
}> => {
  const link = await prisma.mobilePublishLink.findUnique({
    where: { id: linkId },
    select: {
      planId: true,
      legacyLevelId: true,
      connection: { select: { encryptedToken: true, expiresAt: true } },
    },
  });

  if (link === null) {
    throw new NotFoundError("Mobile publish link not found", { linkId });
  }

  return {
    planId: link.planId,
    legacyLevelId: link.legacyLevelId,
    encryptedToken: link.connection.encryptedToken,
    expiresAt: link.connection.expiresAt,
  };
};

const decryptToken = (encryptedToken: string): string => {
  try {
    return decrypt(encryptedToken);
  } catch {
    throw tokenUnreadableError();
  }
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

export const createPublishApi = (legacyClient: LegacyMobileClientPort): PublishApi => ({
  publish: async (userId, data) => {
    await verifyMobileLinkOwnership(data.linkId, userId);

    const link = await loadLink(data.linkId);
    const token = decryptToken(link.encryptedToken);

    if (link.expiresAt.getTime() <= Date.now()) {
      throw reconnectRequiredError("Mobile session expired — please reconnect");
    }

    const weekStartDate = resolveWeekStartDate(data.startDate);
    const dayOfWeek: DayOfWeek | undefined = data.scope === "day" ? data.dayOfWeek : undefined;
    const days = sortDaysByDate(
      await loadTargetDays(link.planId, weekStartDate, dayOfWeek),
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
            legacyClient,
            token,
            linkId: data.linkId,
            legacyLevelId: link.legacyLevelId,
            scheduledDate,
            absoluteDate,
            day,
            exerciseById,
            overwriteUnowned: data.overwriteUnowned,
          }),
        );
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw reconnectRequiredError("Mobile session rejected — please reconnect");
        }

        const code = error instanceof AppError ? error.code : "unknown";

        logger.warn("mobile.publish.day_failed", { linkId: data.linkId, scheduledDate, code });
        results.push({ scheduledDate, action: "failed", legacyRowId: null });
      }
    }

    return { results };
  },
});
