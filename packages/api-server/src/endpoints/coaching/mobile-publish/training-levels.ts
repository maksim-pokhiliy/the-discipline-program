import { type GetTrainingLevelsResponse } from "@repo/contracts/coaching/mobile-connection";
import { BadRequestError, UnauthorizedError } from "@repo/errors";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { decrypt } from "../../../utils/token-cipher";

import { reconnectRequiredError, tokenUnreadableError } from "./reconnect-signal";

export type TrainingLevelsApi = {
  listTrainingLevels(userId: string): Promise<GetTrainingLevelsResponse>;
};

const decryptToken = (encryptedToken: string): string => {
  try {
    return decrypt(encryptedToken);
  } catch {
    throw tokenUnreadableError();
  }
};

export const createTrainingLevelsApi = (
  legacyClient: LegacyMobileClientPort,
): TrainingLevelsApi => ({
  listTrainingLevels: async (userId) => {
    const coachProfileId = await resolveCoachId(userId);
    const connection = await prisma.mobileConnection.findUnique({
      where: { coachProfileId },
      select: { encryptedToken: true },
    });

    if (connection === null) {
      throw new BadRequestError("Connect the mobile app first");
    }

    const token = decryptToken(connection.encryptedToken);

    try {
      return await legacyClient.getTrainingLevels(token);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw reconnectRequiredError("Mobile session expired — please reconnect");
      }

      throw error;
    }
  },
});
