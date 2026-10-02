import { type MobilePublishChannel } from "@prisma/client";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { verifyPlanOwnership } from "./lms-guards";
import { resolveCallerRole } from "./resolve-caller-role";

const LEVEL_PUBLISH_FORBIDDEN_MESSAGE = "Only the head coach can publish to a training level";

export type OwnedMobileLink = {
  planId: string;
  channel: MobilePublishChannel;
  legacyLevelId: number | null;
  legacyUserId: number | null;
};

export const verifyMobileLinkOwnership = async (
  linkId: string,
  userId: string,
): Promise<OwnedMobileLink> => {
  const link = await prisma.mobilePublishLink.findUnique({
    where: { id: linkId },
    select: { planId: true, channel: true, legacyLevelId: true, legacyUserId: true },
  });

  if (!link) {
    throw new NotFoundError("Mobile publish link not found", { linkId });
  }

  await verifyPlanOwnership(link.planId, userId);

  return link;
};

export const verifyCanPublishToLevel = async (userId: string): Promise<void> => {
  const role = await resolveCallerRole(userId);

  if (role === null || !isAdminOrHeadCoach(role)) {
    throw new ForbiddenError(LEVEL_PUBLISH_FORBIDDEN_MESSAGE);
  }
};
