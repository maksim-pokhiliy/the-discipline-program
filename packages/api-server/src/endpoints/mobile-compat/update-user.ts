import type { LegacyShimIdentity, LegacyUserOutcome } from "@repo/api-routes/legacy-shim";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";

import { loadUserDto } from "./user-dto";
import { type LegacyUserDto, parseLegacyDate, type UpdateUserRequest } from "./wire-schemas";

export type UpdateUserApi = {
  updateUser: (
    identity: LegacyShimIdentity,
    input: UpdateUserRequest,
  ) => Promise<LegacyUserOutcome<LegacyUserDto>>;
};

export const createUpdateUserApi = (): UpdateUserApi => ({
  updateUser: async (identity, input) => {
    if (input.id !== identity.legacyUserId) {
      logger.warn("mobile_shim.update_user.scope_mismatch", {
        legacyUserId: identity.legacyUserId,
        requestedId: input.id,
      });

      return { kind: "not-found" };
    }

    await prisma.mobileLegacyIdentity.update({
      where: { userId: identity.userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        dateOfBirth: parseLegacyDate(input.dateOfBirth),
      },
    });

    const payload = await loadUserDto(identity.userId);

    if (!payload) {
      return { kind: "not-found" };
    }

    return { kind: "ok-json", payload };
  },
});
