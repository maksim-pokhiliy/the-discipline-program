import { NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

export const verifyCredentialOwnership = async (
  credentialId: string,
  userId: string,
): Promise<void> => {
  const credential = await prisma.coachCredential.findUnique({
    where: { id: credentialId },
    select: { coachProfile: { select: { userId: true } } },
  });

  if (!credential || credential.coachProfile.userId !== userId) {
    throw new NotFoundError("Coach credential not found", { credentialId });
  }
};
