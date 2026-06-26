import { type MobilePublishLink as PrismaMobilePublishLink } from "@prisma/client";

import { type MobileLink } from "@repo/contracts/coaching/mobile-link";

export const mapToMobileLink = (l: PrismaMobilePublishLink): MobileLink => ({
  id: l.id,
  planId: l.planId,
  channel: l.channel,
  legacyLevelId: l.legacyLevelId,
  legacyUserId: l.legacyUserId,
  athleteId: l.athleteId,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
});
