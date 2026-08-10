import type { LegacyShimIdentity, LegacyUserOutcome } from "@repo/api-routes/legacy-shim";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";
import { iamAuthService } from "../iam/auth-service";

import { type ChangePasswordRequest, newPasswordPolicySchema } from "./wire-schemas";

export type ChangePasswordApi = {
  changePassword: (
    identity: LegacyShimIdentity,
    input: ChangePasswordRequest,
  ) => Promise<LegacyUserOutcome<never>>;
};

export const createChangePasswordApi = (): ChangePasswordApi => ({
  changePassword: async (identity, input) => {
    if (!newPasswordPolicySchema.safeParse(input.newPassword).success) {
      return { kind: "bad-request" };
    }

    if (input.userId !== identity.legacyUserId) {
      logger.warn("mobile_shim.change_password.scope_mismatch", {
        legacyUserId: identity.legacyUserId,
        requestedUserId: input.userId,
      });

      return { kind: "not-found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: identity.userId },
      select: { password: true },
    });

    if (!user || user.password === null) {
      logger.warn("mobile_shim.change_password.no_local_credential", {
        userId: identity.userId,
      });

      return { kind: "unauthorized" };
    }

    if (!(await iamAuthService.comparePassword(input.oldPassword, user.password))) {
      return { kind: "unauthorized" };
    }

    if (await iamAuthService.comparePassword(input.newPassword, user.password)) {
      return { kind: "bad-request" };
    }

    await prisma.user.update({
      where: { id: identity.userId },
      data: {
        password: await iamAuthService.hashPassword(input.newPassword),
        tokenVersion: { increment: 1 },
      },
    });

    return { kind: "ok-empty" };
  },
});
