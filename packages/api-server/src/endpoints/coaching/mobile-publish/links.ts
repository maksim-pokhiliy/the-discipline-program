import { type CreateMobileLinkData, type MobileLink } from "@repo/contracts/coaching/mobile-link";
import { BadRequestError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToMobileLink } from "../../../mappers/coaching";
import { handlePrismaError } from "../../../utils";

const LINK_CHANNEL = "GENERAL" as const;

export type LinksApi = {
  createLink(userId: string, data: CreateMobileLinkData): Promise<MobileLink>;
};

export const linksApi: LinksApi = {
  createLink: async (userId, data) => {
    const coachProfileId = await resolveCoachId(userId);

    await verifyPlanOwnership(data.planId, userId);

    const connection = await prisma.mobileConnection.findUnique({
      where: { coachProfileId },
      select: { id: true },
    });

    if (connection === null) {
      throw new BadRequestError("Connect the mobile app first");
    }

    try {
      const link = await prisma.mobilePublishLink.upsert({
        where: {
          planId_channel_legacyLevelId: {
            planId: data.planId,
            channel: LINK_CHANNEL,
            legacyLevelId: data.legacyLevelId,
          },
        },
        create: {
          connectionId: connection.id,
          planId: data.planId,
          channel: LINK_CHANNEL,
          legacyLevelId: data.legacyLevelId,
        },
        update: { connectionId: connection.id },
      });

      return mapToMobileLink(link);
    } catch (error) {
      return handlePrismaError(error, { entity: "Mobile publish link" });
    }
  },
};
