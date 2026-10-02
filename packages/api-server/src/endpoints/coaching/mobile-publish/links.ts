import { Prisma, type MobilePublishLink as PrismaMobilePublishLink } from "@prisma/client";

import {
  type CreateMobileLinkRequest,
  type MobileLink,
  type MobileLinkPublishAggregate,
} from "@repo/contracts/coaching/mobile-link";
import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { BadRequestError, ConflictError } from "@repo/errors";
import { parseDateParam } from "@repo/shared";

import { verifyMobileLinkOwnership, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToMobileLink } from "../../../mappers/coaching";
import { handlePrismaError } from "../../../utils";
import { resolveWeekStartDate, sessionAbsoluteDateFromParts } from "../../lms/_shared";
import {
  findLegacyCatalogEntry,
  LEGACY_PLAN_INDIVIDUAL,
  LEGACY_TRAINING_LEVELS,
} from "../../mobile-compat/legacy-catalogs";

import { enrolledInPlanWhere } from "./enrolled-athlete-where";

export type LinksApi = {
  createLink(userId: string, data: CreateMobileLinkRequest): Promise<MobileLink>;
  listLinks(userId: string, planId: string, weekStart?: string): Promise<MobileLink[]>;
  deleteLink(userId: string, linkId: string): Promise<void>;
};

const NEVER_PUBLISHED: MobileLinkPublishAggregate = { publishedDayCount: 0, lastPublishedAt: null };
const WEEK_START_FIELD = "weekStart";
const INVALID_WEEK_START_MESSAGE = "weekStart must be a valid YYYY-MM-DD date";
const NO_INDIVIDUAL_ACCOUNT_MESSAGE =
  "This athlete has no Individual-plan account in the mobile app";
const NOT_ENROLLED_MESSAGE = "This athlete is not enrolled in this plan";
const UNKNOWN_LEVEL_MESSAGE = "Unknown training level";

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

const upsertGeneralLink = (data: {
  planId: string;
  legacyLevelId: number;
}): Promise<PrismaMobilePublishLink> =>
  prisma.mobilePublishLink.upsert({
    where: {
      planId_channel_legacyLevelId: {
        planId: data.planId,
        channel: "GENERAL",
        legacyLevelId: data.legacyLevelId,
      },
    },
    create: {
      planId: data.planId,
      channel: "GENERAL",
      legacyLevelId: data.legacyLevelId,
    },
    update: {},
  });

const assertKnownLevel = (legacyLevelId: number): void => {
  if (findLegacyCatalogEntry(LEGACY_TRAINING_LEVELS, legacyLevelId) === null) {
    throw new BadRequestError(UNKNOWN_LEVEL_MESSAGE, { field: "legacyLevelId" });
  }
};

const resolveIndividualLegacyUserId = async (
  planId: string,
  athleteId: string,
): Promise<number> => {
  const athlete = await prisma.user.findFirst({
    where: { id: athleteId, ...enrolledInPlanWhere(planId) },
    select: { legacyIdentity: { select: { legacyUserId: true, legacyPlanId: true } } },
  });

  if (athlete === null) {
    throw new BadRequestError(NOT_ENROLLED_MESSAGE, { field: "athleteId" });
  }

  const identity = athlete.legacyIdentity;

  if (identity === null || identity.legacyPlanId !== LEGACY_PLAN_INDIVIDUAL) {
    throw new BadRequestError(NO_INDIVIDUAL_ACCOUNT_MESSAGE, { field: "athleteId" });
  }

  return identity.legacyUserId;
};

const upsertIndividualLink = (data: {
  planId: string;
  athleteId: string;
  legacyUserId: number;
}): Promise<PrismaMobilePublishLink> =>
  prisma.mobilePublishLink.upsert({
    where: {
      planId_channel_athleteId: {
        planId: data.planId,
        channel: "INDIVIDUAL",
        athleteId: data.athleteId,
      },
    },
    create: {
      planId: data.planId,
      channel: "INDIVIDUAL",
      legacyUserId: data.legacyUserId,
      athleteId: data.athleteId,
    },
    update: { legacyUserId: data.legacyUserId },
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

const runLinkUpsert = async (
  upsert: () => Promise<PrismaMobilePublishLink>,
): Promise<PrismaMobilePublishLink> => {
  try {
    return await upsert();
  } catch (error) {
    if (isLegacyUserAlreadyLinked(error)) {
      throw new ConflictError("This mobile athlete is already linked to another plan member", {
        field: "legacyUserId",
      });
    }

    return handlePrismaError(error, { entity: "Mobile publish link" });
  }
};

const upsertLink = async (data: CreateMobileLinkRequest): Promise<PrismaMobilePublishLink> => {
  if (!("channel" in data)) {
    assertKnownLevel(data.legacyLevelId);

    return runLinkUpsert(() => upsertGeneralLink(data));
  }

  const legacyUserId = await resolveIndividualLegacyUserId(data.planId, data.athleteId);

  return runLinkUpsert(() => upsertIndividualLink({ ...data, legacyUserId }));
};

export const linksApi: LinksApi = {
  createLink: async (userId, data) => {
    await verifyPlanOwnership(data.planId, userId);

    const link = await upsertLink(data);

    return mapToMobileLink(link, await loadPublishAggregate(link.id));
  },

  listLinks: async (userId, planId, weekStart) => {
    const weekScheduledDates =
      weekStart === undefined ? undefined : buildWeekScheduledDates(weekStart);

    await verifyPlanOwnership(planId, userId);

    const links = await prisma.mobilePublishLink.findMany({
      where: { planId },
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
