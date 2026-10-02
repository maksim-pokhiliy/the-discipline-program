import { NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { verifyPlanOwnership } from "./lms-guards";

export const verifyMobileLinkOwnership = async (
  linkId: string,
  userId: string,
): Promise<{ planId: string }> => {
  const link = await prisma.mobilePublishLink.findUnique({
    where: { id: linkId },
    select: { planId: true },
  });

  if (!link) {
    throw new NotFoundError("Mobile publish link not found", { linkId });
  }

  await verifyPlanOwnership(link.planId, userId);

  return { planId: link.planId };
};
