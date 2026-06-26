import { type MobilePublishLink as PrismaMobilePublishLink } from "@prisma/client";

import { type MobileLink } from "@repo/contracts/coaching/mobile-link";
import { InternalServerError } from "@repo/errors";

export const mapToMobileLink = (l: PrismaMobilePublishLink): MobileLink => {
  const base = { id: l.id, planId: l.planId, createdAt: l.createdAt, updatedAt: l.updatedAt };

  if (l.channel === "INDIVIDUAL") {
    if (l.legacyUserId === null || l.athleteId === null) {
      throw new InternalServerError("Individual mobile link is missing its identity keys");
    }

    return {
      ...base,
      channel: "INDIVIDUAL",
      legacyLevelId: null,
      legacyUserId: l.legacyUserId,
      athleteId: l.athleteId,
    };
  }

  if (l.legacyLevelId === null) {
    throw new InternalServerError("General mobile link is missing legacyLevelId");
  }

  return {
    ...base,
    channel: "GENERAL",
    legacyLevelId: l.legacyLevelId,
    legacyUserId: null,
    athleteId: null,
  };
};
