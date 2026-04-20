import crypto from "node:crypto";

import { type UserInviteToken } from "@prisma/client";

import { type ConsumeInviteResponse, type InviteToken } from "@repo/contracts/iam/invite-token";
import { baseEnv } from "@repo/env/base";
import { GoneError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";
import { mapToInviteToken } from "../../mappers/iam";
import { findOrThrow } from "../../utils";

import { iamAuthService } from "./auth-service";

const TOKEN_BYTES = 32;
const MS_PER_HOUR = 3_600_000;
const GENERIC_GONE_MESSAGE = "This invite link is no longer valid";

type IssueInviteTokenInput = {
  userId: string;
  createdByAdminId: string;
  ttlHours?: number;
};

type IssueInviteTokenResult = {
  plainToken: string;
  expiresAt: Date;
};

type InvalidationReason = "NOT_FOUND" | "CONSUMED" | "EXPIRED";

const hashToken = (plainToken: string): string =>
  crypto.createHash("sha256").update(plainToken).digest("hex");

const generatePlainToken = (): string => crypto.randomBytes(TOKEN_BYTES).toString("base64url");

const resolveTtlHours = (ttlHours?: number): number => ttlHours ?? baseEnv.INVITE_TOKEN_TTL_HOURS;

const checkTokenValidity = (row: UserInviteToken | null, now: Date): InvalidationReason | null => {
  if (!row) {
    return "NOT_FOUND";
  }

  if (row.consumedAt !== null) {
    return "CONSUMED";
  }

  if (row.expiresAt.getTime() <= now.getTime()) {
    return "EXPIRED";
  }

  return null;
};

const throwGenericGone = (reason: InvalidationReason, context: Record<string, unknown>): never => {
  logger.warn("invite.validate_failed", { reason, ...context });

  throw new GoneError(GENERIC_GONE_MESSAGE);
};

export const iamInviteTokenApi = {
  issue: async (input: IssueInviteTokenInput): Promise<IssueInviteTokenResult> => {
    const plainToken = generatePlainToken();
    const tokenHash = hashToken(plainToken);
    const ttlHours = resolveTtlHours(input.ttlHours);
    const expiresAt = new Date(Date.now() + ttlHours * MS_PER_HOUR);

    await prisma.$transaction(async (tx) => {
      await tx.userInviteToken.updateMany({
        where: { userId: input.userId, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      await tx.userInviteToken.create({
        data: {
          userId: input.userId,
          tokenHash,
          expiresAt,
          createdByAdminId: input.createdByAdminId,
        },
      });
    });

    return { plainToken, expiresAt };
  },

  validate: async (plainToken: string): Promise<InviteToken> => {
    const tokenHash = hashToken(plainToken);

    const row = await prisma.userInviteToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const reason = checkTokenValidity(row, new Date());

    if (reason !== null || row === null) {
      return throwGenericGone(reason ?? "NOT_FOUND", { tokenId: row?.id });
    }

    return mapToInviteToken(row.user, row.expiresAt);
  },

  consume: async (plainToken: string, password: string): Promise<ConsumeInviteResponse> => {
    const tokenHash = hashToken(plainToken);

    const row = await prisma.userInviteToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const reason = checkTokenValidity(row, new Date());

    if (reason !== null || row === null) {
      return throwGenericGone(reason ?? "NOT_FOUND", { tokenId: row?.id });
    }

    const user = await findOrThrow(prisma.user.findUnique({ where: { id: row.userId } }), "User");

    const passwordHash = await iamAuthService.hashPassword(password);

    await prisma.$transaction([
      prisma.userInviteToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          emailVerified: new Date(),
          tokenVersion: { increment: 1 },
        },
      }),
    ]);

    logger.info("invite.consumed", { userId: user.id, tokenId: row.id });

    return { userId: user.id, redirectTo: "/dashboard" };
  },
};
