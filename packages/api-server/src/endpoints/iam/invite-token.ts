import crypto from "node:crypto";

import { type UserInviteToken } from "@prisma/client";

import { ROLE_HOMES, type UserRole } from "@repo/contracts/iam/auth";
import { type ConsumeInviteResponse, type InviteToken } from "@repo/contracts/iam/invite-token";
import { baseEnv } from "@repo/env/base";
import { GoneError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";
import { type TxClient } from "../../db/tx";
import { mapToInviteToken, ROLE_MAP } from "../../mappers/iam";

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

type InvalidationReason = "NOT_FOUND" | "CONSUMED" | "EXPIRED" | "DELETED_USER";

type ConsumeInviteInput = {
  password: string;
  timezone?: string;
};

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

const resolveRedirectTo = (role: UserRole): string => ROLE_HOMES[role];

const issueInTx = async (
  tx: TxClient,
  input: IssueInviteTokenInput,
): Promise<IssueInviteTokenResult> => {
  const plainToken = generatePlainToken();
  const tokenHash = hashToken(plainToken);
  const ttlHours = resolveTtlHours(input.ttlHours);
  const expiresAt = new Date(Date.now() + ttlHours * MS_PER_HOUR);

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

  return { plainToken, expiresAt };
};

export const iamInviteTokenApi = {
  issue: async (input: IssueInviteTokenInput): Promise<IssueInviteTokenResult> =>
    prisma.$transaction((tx) => issueInTx(tx, input)),

  issueInTx,

  validate: async (plainToken: string): Promise<InviteToken> => {
    const tokenHash = hashToken(plainToken);

    const row = await prisma.userInviteToken.findUnique({ where: { tokenHash } });

    const reason = checkTokenValidity(row, new Date());

    if (reason !== null || row === null) {
      return throwGenericGone(reason ?? "NOT_FOUND", { tokenId: row?.id });
    }

    const user = await prisma.user.findUnique({ where: { id: row.userId } });

    if (!user || user.deletedAt !== null) {
      return throwGenericGone(user ? "DELETED_USER" : "NOT_FOUND", { tokenId: row.id });
    }

    return mapToInviteToken(user, row.expiresAt);
  },

  consume: async (
    plainToken: string,
    input: ConsumeInviteInput,
  ): Promise<ConsumeInviteResponse> => {
    const tokenHash = hashToken(plainToken);
    const passwordHash = await iamAuthService.hashPassword(input.password);

    return prisma.$transaction(async (tx) => {
      const consumed = await tx.userInviteToken.updateMany({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });

      if (consumed.count === 0) {
        return throwGenericGone("NOT_FOUND", { tokenHashPrefix: tokenHash.slice(0, 12) });
      }

      const row = await tx.userInviteToken.findUnique({ where: { tokenHash } });

      if (!row) {
        return throwGenericGone("NOT_FOUND", { tokenHashPrefix: tokenHash.slice(0, 12) });
      }

      const user = await tx.user.findUnique({ where: { id: row.userId } });

      if (!user || user.deletedAt !== null) {
        return throwGenericGone(user ? "DELETED_USER" : "NOT_FOUND", { tokenId: row.id });
      }

      const userUpdateData: {
        password: string;
        emailVerified: Date;
        tokenVersion: { increment: number };
        timezone?: string;
      } = {
        password: passwordHash,
        emailVerified: new Date(),
        tokenVersion: { increment: 1 },
      };

      if (input.timezone !== undefined) {
        userUpdateData.timezone = input.timezone;
      }

      await tx.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });

      logger.info("invite.consumed", { userId: user.id, tokenId: row.id });

      return {
        email: user.email,
        redirectTo: resolveRedirectTo(ROLE_MAP[user.role]),
      };
    });
  },
};
