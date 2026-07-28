import { Prisma, type MobilePublishLink as PrismaMobilePublishLink } from "@prisma/client";

import {
  type CreateMobileLinkRequest,
  type MobileLink,
  type MobileLinkPublishAggregate,
} from "@repo/contracts/coaching/mobile-link";
import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { BadRequestError, ConflictError } from "@repo/errors";
import { parseDateParam } from "@repo/shared";

import {
  resolveCoachId,
  verifyMobileLinkOwnership,
  verifyPlanOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToMobileLink } from "../../../mappers/coaching";
import { handlePrismaError } from "../../../utils";
import { resolveWeekStartDate, sessionAbsoluteDateFromParts } from "../../lms/_shared";

export type LinksApi = {
  createLink(userId: string, data: CreateMobileLinkRequest): Promise<MobileLink>;
  listLinks(userId: string, planId: string, weekStart?: string): Promise<MobileLink[]>;
  deleteLink(userId: string, linkId: string): Promise<void>;
};

const NEVER_PUBLISHED: MobileLinkPublishAggregate = { publishedDayCount: 0, lastPublishedAt: null };
const WEEK_START_FIELD = "weekStart";
const INVALID_WEEK_START_MESSAGE = "weekStart must be a valid YYYY-MM-DD date";

export const buildWeekScheduledDates = (weekStart: string): Date[] => {
  if (parseDateParam(weekStart) === null) {
    throw new BadRequestError(INVALID_WEEK_START_MESSAGE, { field: WEEK_START_FIELD });
  }

  const weekStartDate = resolveWeekStartDate(weekStart);

  return dayOfWeekValues.map((dayOfWeek) => sessionAbsoluteDateFromParts(weekStartDate, dayOfWeek));
};

const loadPublishAggregates = async (
  linkIds: string[],
  scheduledDates?: Date[],
): Promise<Map<string, MobileLinkPublishAggregate>> => {
  const publishedDays = await prisma.mobilePublishedDay.groupBy({
    by: ["linkId"],
    where: {
      linkId: { in: linkIds },
      ...(scheduledDates !== undefined && { scheduledDate: { in: scheduledDates } }),
    },
    _count: { id: true },
    _max: { publishedAt: true },
  });

  return new Map(
    publishedDays.map((row) => [
      row.linkId,
      { publishedDayCount: row._count.id, lastPublishedAt: row._max.publishedAt },
    ]),
  );
};

const loadPublishAggregate = async (linkId: string): Promise<MobileLinkPublishAggregate> => {
  const aggregates = await loadPublishAggregates([linkId]);

  return aggregates.get(linkId) ?? NEVER_PUBLISHED;
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

const upsertGeneralLink = (
  connectionId: string,
  data: { planId: string; legacyLevelId: number },
): Promise<PrismaMobilePublishLink> =>
  prisma.mobilePublishLink.upsert({
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
  });

const upsertIndividualLink = (
  connectionId: string,
  data: { planId: string; athleteId: string; legacyUserId: number },
): Promise<PrismaMobilePublishLink> =>
  prisma.mobilePublishLink.upsert({
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
  });

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

const upsertLink = async (
  connectionId: string,
  data: CreateMobileLinkRequest,
): Promise<PrismaMobilePublishLink> => {
  try {
    return "channel" in data
      ? await upsertIndividualLink(connectionId, data)
      : await upsertGeneralLink(connectionId, data);
  } catch (error) {
    if (isLegacyUserAlreadyLinked(error)) {
      throw new ConflictError("This mobile athlete is already linked to another plan member", {
        field: "legacyUserId",
      });
    }

    return handlePrismaError(error, { entity: "Mobile publish link" });
  }
};

export const linksApi: LinksApi = {
  createLink: async (userId, data) => {
    const connectionId = await loadCoachConnectionId(userId, data.planId);
    const link = await upsertLink(connectionId, data);

    return mapToMobileLink(link, await loadPublishAggregate(link.id));
  },

  listLinks: async (userId, planId, weekStart) => {
    const weekScheduledDates =
      weekStart === undefined ? undefined : buildWeekScheduledDates(weekStart);
    const coachProfileId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, userId);

    const links = await prisma.mobilePublishLink.findMany({
      where: { planId, connection: { coachProfileId } },
      orderBy: { createdAt: "asc" },
    });

    if (links.length === 0) {
      return [];
    }

    const linkIds = links.map((link) => link.id);
    const [lifetimeAggregates, weekAggregates] = await Promise.all([
      loadPublishAggregates(linkIds),
      weekScheduledDates === undefined
        ? undefined
        : loadPublishAggregates(linkIds, weekScheduledDates),
    ]);

    return links.map((link) =>
      mapToMobileLink(
        link,
        lifetimeAggregates.get(link.id) ?? NEVER_PUBLISHED,
        weekAggregates === undefined ? undefined : (weekAggregates.get(link.id) ?? NEVER_PUBLISHED),
      ),
    );
  },

  deleteLink: async (userId, linkId) => {
    await verifyMobileLinkOwnership(linkId, userId);

    await prisma.mobilePublishLink.delete({ where: { id: linkId } });
  },
};
