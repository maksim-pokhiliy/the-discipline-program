import { type MobileConnection as PrismaMobileConnection } from "@prisma/client";

import { type MobileConnection } from "@repo/contracts/coaching/mobile-connection";

export const mapToMobileConnection = (c: PrismaMobileConnection): MobileConnection => ({
  id: c.id,
  legacyUserId: c.legacyUserId,
  legacyUserName: c.legacyUserName,
  legacyUserRole: c.legacyUserRole,
  expiresAt: c.expiresAt,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
