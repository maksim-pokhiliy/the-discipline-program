import { logger } from "@repo/shared";

import { type ExtendedPrismaClient, prisma as defaultPrisma } from "../../db/client";

import {
  MS_PER_DAY,
  RETENTION_ACTION_ITEM_TTL_DAYS,
  RETENTION_INVITE_TOKEN_TTL_DAYS,
  RETENTION_MARKETING_SUBMISSION_TTL_DAYS,
} from "./constants";

export type RetentionSweepResult = {
  requestIdempotencyDeleted: number;
  inviteTokenDeleted: number;
  actionItemDeleted: number;
  contactSubmissionDeleted: number;
};

const subtractDays = (now: Date, days: number): Date => new Date(now.getTime() - days * MS_PER_DAY);

export const runRetentionSweep = async (
  client: ExtendedPrismaClient = defaultPrisma,
): Promise<RetentionSweepResult> => {
  const now = new Date();
  const inviteTokenCutoff = subtractDays(now, RETENTION_INVITE_TOKEN_TTL_DAYS);
  const actionItemCutoff = subtractDays(now, RETENTION_ACTION_ITEM_TTL_DAYS);
  const submissionCutoff = subtractDays(now, RETENTION_MARKETING_SUBMISSION_TTL_DAYS);

  const result = await client.$transaction(async (tx) => {
    const requestIdempotency = await tx.requestIdempotency.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const inviteToken = await tx.userInviteToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: inviteTokenCutoff } }, { consumedAt: { lt: inviteTokenCutoff } }],
      },
    });

    const actionItem = await tx.coachActionItem.deleteMany({
      where: { resolvedAt: { lt: actionItemCutoff } },
    });

    const contactSubmissionCount = await tx.$executeRaw`
      DELETE FROM marketing_contact_submissions WHERE "deletedAt" < ${submissionCutoff}
    `;

    return {
      requestIdempotencyDeleted: requestIdempotency.count,
      inviteTokenDeleted: inviteToken.count,
      actionItemDeleted: actionItem.count,
      contactSubmissionDeleted: contactSubmissionCount,
    };
  });

  logger.info("retention.sweep.completed", { ...result });

  return result;
};
