import crypto from "node:crypto";

import { type PasswordResetToken } from "@prisma/client";

import {
  type ConsumePasswordResetResponse,
  type PasswordResetInfo,
} from "@repo/contracts/iam/password-reset";
import { GoneError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";
import { type TxClient } from "../../db/tx";

import { iamAuthService } from "./auth-service";
import { sendPasswordResetEmail } from "./send-password-reset-email";

const RESET_TOKEN_BYTES = 32;
const MS_PER_HOUR = 3_600_000;
const RESET_TOKEN_TTL_HOURS = 1;
const GENERIC_GONE_MESSAGE = "This password reset link is no longer valid";

type InvalidationReason = "NOT_FOUND" | "CONSUMED" | "EXPIRED" | "DELETED_USER";

const hashToken = (plainToken: string): string =>
  crypto.createHash("sha256").update(plainToken).digest("hex");

const generatePlainToken = (): string =>
  crypto.randomBytes(RESET_TOKEN_BYTES).toString("base64url");

const checkTokenValidity = (
  row: PasswordResetToken | null,
  now: Date,
): InvalidationReason | null => {
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
  logger.warn("password_reset.validate_failed", { reason, ...context });

  throw new GoneError(GENERIC_GONE_MESSAGE);
};

const issueInTx = async (
  tx: TxClient,
  userId: string,
): Promise<{ plainToken: string; expiresAt: Date }> => {
  const plainToken = generatePlainToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * MS_PER_HOUR);

  await tx.passwordResetToken.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await tx.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { plainToken, expiresAt };
};

export const iamPasswordResetApi = {
  request: async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.deletedAt !== null) {
      return;
    }

    try {
      const { plainToken } = await prisma.$transaction((tx) => issueInTx(tx, user.id));

      await sendPasswordResetEmail({
        userId: user.id,
        recipientEmail: user.email,
        recipientName: user.name,
        plainToken,
        expiresInHours: RESET_TOKEN_TTL_HOURS,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";

      logger.error("password_reset.request_failed", { userId: user.id, reason });
    }
  },

  validate: async (plainToken: string): Promise<PasswordResetInfo> => {
    const tokenHash = hashToken(plainToken);

    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    const reason = checkTokenValidity(row, new Date());

    if (reason !== null || row === null) {
      return throwGenericGone(reason ?? "NOT_FOUND", { tokenId: row?.id });
    }

    const user = await prisma.user.findUnique({ where: { id: row.userId } });

    if (!user || user.deletedAt !== null) {
      return throwGenericGone(user ? "DELETED_USER" : "NOT_FOUND", { tokenId: row.id });
    }

    return { email: user.email };
  },

  consume: async (
    plainToken: string,
    input: { password: string },
  ): Promise<ConsumePasswordResetResponse> => {
    const tokenHash = hashToken(plainToken);
    const passwordHash = await iamAuthService.hashPassword(input.password);

    return prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
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

      const row = await tx.passwordResetToken.findUnique({ where: { tokenHash } });

      if (!row) {
        return throwGenericGone("NOT_FOUND", { tokenHashPrefix: tokenHash.slice(0, 12) });
      }

      const user = await tx.user.findUnique({ where: { id: row.userId } });

      if (!user || user.deletedAt !== null) {
        return throwGenericGone(user ? "DELETED_USER" : "NOT_FOUND", { tokenId: row.id });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash, tokenVersion: { increment: 1 } },
      });

      logger.info("password_reset.consumed", { userId: user.id, tokenId: row.id });

      return { email: user.email, redirectTo: "/login" };
    });
  },
};
