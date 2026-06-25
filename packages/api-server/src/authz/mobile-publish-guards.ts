import { NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

export const verifyMobileLinkOwnership = async (linkId: string, userId: string): Promise<void> => {
  const link = await prisma.mobilePublishLink.findUnique({
    where: { id: linkId },
    select: { connection: { select: { coachProfile: { select: { userId: true } } } } },
  });

  if (!link || link.connection.coachProfile.userId !== userId) {
    throw new NotFoundError("Mobile publish link not found", { linkId });
  }
};
