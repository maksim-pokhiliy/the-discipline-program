import type { LegacyShimIdentity, LegacyUserOutcome } from "@repo/api-routes/legacy-shim";
import { logger } from "@repo/shared";

import { loadUserDto } from "./user-dto";
import type { LegacyUserDto } from "./wire-schemas";

export type GetUserApi = {
  getUser: (identity: LegacyShimIdentity, id: number) => Promise<LegacyUserOutcome<LegacyUserDto>>;
};

export const createGetUserApi = (): GetUserApi => ({
  getUser: async (identity, id) => {
    if (id !== identity.legacyUserId) {
      logger.warn("mobile_shim.get_user.scope_mismatch", {
        legacyUserId: identity.legacyUserId,
        requestedId: id,
      });

      return { kind: "not-found" };
    }

    const payload = await loadUserDto(identity.userId);

    if (!payload) {
      return { kind: "not-found" };
    }

    return { kind: "ok-json", payload };
  },
});
