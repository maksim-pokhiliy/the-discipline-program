import { type Prisma } from "@prisma/client";

import { prisma } from "../../../db/client";

export type PublishAudience =
  | { channel: "GENERAL"; legacyLevelId: number }
  | { channel: "INDIVIDUAL"; legacyUserId: number };

const audienceLinkFilter = (audience: PublishAudience): Prisma.MobilePublishLinkWhereInput =>
  audience.channel === "INDIVIDUAL"
    ? { channel: "INDIVIDUAL", legacyUserId: audience.legacyUserId }
    : { channel: "GENERAL", legacyLevelId: audience.legacyLevelId };

export const loadServedDayId = async (
  audience: PublishAudience,
  scheduledDate: Date,
): Promise<string | null> => {
  const served = await prisma.mobilePublishedDay.findFirst({
    where: { scheduledDate, isRestDay: { not: null }, link: audienceLinkFilter(audience) },
    orderBy: [{ publishedAt: "desc" }, { legacyRowId: "desc" }],
    select: { id: true },
  });

  return served?.id ?? null;
};
