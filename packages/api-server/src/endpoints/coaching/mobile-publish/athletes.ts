import { type GetMobileAthletesResponse } from "@repo/contracts/coaching/mobile-connection";
import { BadRequestError, UnauthorizedError } from "@repo/errors";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { decrypt } from "../../../utils/token-cipher";

import { reconnectRequiredError, tokenUnreadableError } from "./reconnect-signal";

export type AthletesApi = {
  listIndividualAthletes(userId: string): Promise<GetMobileAthletesResponse>;
};

const decryptToken = (encryptedToken: string): string => {
  try {
    return decrypt(encryptedToken);
  } catch {
    throw tokenUnreadableError();
  }
};

export const createAthletesApi = (legacyClient: LegacyMobileClientPort): AthletesApi => ({
  listIndividualAthletes: async (userId) => {
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
      return await legacyClient.getIndividualAthletes(token);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw reconnectRequiredError("Mobile session expired — please reconnect");
      }

      throw error;
    }
  },
});
