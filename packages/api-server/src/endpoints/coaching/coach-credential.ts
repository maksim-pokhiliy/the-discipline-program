import {
  type CoachCredential,
  COACH_CREDENTIAL_CONSTANTS,
  type CreateCoachCredentialData,
  type UpdateCoachCredentialData,
} from "@repo/contracts/coaching/coach-credential";
import { BadRequestError } from "@repo/errors";

import { resolveCoachId, verifyCredentialOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToCoachCredential } from "../../mappers/coaching";
import { handlePrismaError } from "../../utils";

const assertYearWithinBounds = (year: number): void => {
  const currentYear = new Date().getFullYear();

  if (year > currentYear) {
    throw new BadRequestError(
      `Year must be between ${COACH_CREDENTIAL_CONSTANTS.MIN_YEAR} and ${currentYear}`,
      { year },
    );
  }
};

export const coachingCoachCredentialApi = {
  create: async (userId: string, data: CreateCoachCredentialData): Promise<CoachCredential> => {
    const coachProfileId = await resolveCoachId(userId);

    assertYearWithinBounds(data.year);

    try {
      const credential = await prisma.coachCredential.create({
        data: { ...data, coachProfileId },
      });

      return mapToCoachCredential(credential);
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach credential" });
    }
  },

  update: async (
    userId: string,
    credentialId: string,
    data: UpdateCoachCredentialData,
  ): Promise<CoachCredential> => {
    await verifyCredentialOwnership(credentialId, userId);

    if (data.year !== undefined) {
      assertYearWithinBounds(data.year);
    }

    try {
      const credential = await prisma.coachCredential.update({
        where: { id: credentialId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.issuer !== undefined && { issuer: data.issuer }),
          ...(data.year !== undefined && { year: data.year }),
          ...(data.shownToAthletes !== undefined && { shownToAthletes: data.shownToAthletes }),
        },
      });

      return mapToCoachCredential(credential);
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach credential" });
    }
  },

  delete: async (userId: string, credentialId: string): Promise<void> => {
    await verifyCredentialOwnership(credentialId, userId);

    try {
      await prisma.coachCredential.delete({ where: { id: credentialId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach credential" });
    }
  },
};
