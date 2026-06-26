import { Prisma } from "@prisma/client";

import {
  type CreateMobileLinkRequest,
  type MobileLink,
} from "@repo/contracts/coaching/mobile-link";
import { BadRequestError, ConflictError } from "@repo/errors";

import {
  resolveCoachId,
  verifyMobileLinkOwnership,
  verifyPlanOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToMobileLink } from "../../../mappers/coaching";
import { handlePrismaError } from "../../../utils";

export type LinksApi = {
  createLink(userId: string, data: CreateMobileLinkRequest): Promise<MobileLink>;
  listLinks(userId: string, planId: string): Promise<MobileLink[]>;
  deleteLink(userId: string, linkId: string): Promise<void>;
};

const loadCoachConnectionId = async (userId: string, planId: string): Promise<string> => {
  const coachProfileId = await resolveCoachId(userId);

  await verifyPlanOwnership(planId, userId);

  const connection = await prisma.mobileConnection.findUnique({
    where: { coachProfileId },
    select: { id: true },
  });

  if (connection === null) {
    throw new BadRequestError("Connect the mobile app first");
  }

  return connection.id;
};

const createGeneralLink = (
  connectionId: string,
  data: { planId: string; legacyLevelId: number },
): Promise<MobileLink> =>
  prisma.mobilePublishLink
    .upsert({
      where: {
        planId_channel_legacyLevelId: {
          planId: data.planId,
          channel: "GENERAL",
          legacyLevelId: data.legacyLevelId,
        },
      },
      create: {
        connectionId,
        planId: data.planId,
        channel: "GENERAL",
        legacyLevelId: data.legacyLevelId,
      },
      update: { connectionId },
    })
    .then(mapToMobileLink);

const createIndividualLink = (
  connectionId: string,
  data: { planId: string; athleteId: string; legacyUserId: number },
): Promise<MobileLink> =>
  prisma.mobilePublishLink
    .upsert({
      where: {
        planId_channel_athleteId: {
          planId: data.planId,
          channel: "INDIVIDUAL",
          athleteId: data.athleteId,
        },
      },
      create: {
        connectionId,
        planId: data.planId,
        channel: "INDIVIDUAL",
        legacyUserId: data.legacyUserId,
        athleteId: data.athleteId,
      },
      update: { connectionId, legacyUserId: data.legacyUserId },
    })
    .then(mapToMobileLink);

const isLegacyUserAlreadyLinked = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  return (
    (Array.isArray(target) && target.includes("legacyUserId")) ||
    (typeof target === "string" && target.includes("legacyUserId"))
  );
};

export const linksApi: LinksApi = {
  createLink: async (userId, data) => {
    const connectionId = await loadCoachConnectionId(userId, data.planId);

    try {
      return "channel" in data
        ? await createIndividualLink(connectionId, data)
        : await createGeneralLink(connectionId, data);
    } catch (error) {
      if (isLegacyUserAlreadyLinked(error)) {
        throw new ConflictError("This mobile athlete is already linked to another plan member", {
          field: "legacyUserId",
        });
      }

      return handlePrismaError(error, { entity: "Mobile publish link" });
    }
  },

  listLinks: async (userId, planId) => {
    const coachProfileId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, userId);

    const links = await prisma.mobilePublishLink.findMany({
      where: { planId, connection: { coachProfileId } },
      orderBy: { createdAt: "asc" },
    });

    return links.map(mapToMobileLink);
  },

  deleteLink: async (userId, linkId) => {
    await verifyMobileLinkOwnership(linkId, userId);

    await prisma.mobilePublishLink.delete({ where: { id: linkId } });
  },
};
