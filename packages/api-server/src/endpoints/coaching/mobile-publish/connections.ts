import {
  type ConnectMobileData,
  type MobileConnection,
} from "@repo/contracts/coaching/mobile-connection";
import { logger } from "@repo/shared";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { mapToMobileConnection } from "../../../mappers/coaching";
import { handlePrismaError } from "../../../utils";
import { encrypt } from "../../../utils/token-cipher";

import { deriveTokenExpiry } from "./token-expiry";

export type ConnectionsApi = {
  connect(userId: string, data: ConnectMobileData): Promise<MobileConnection>;
  listConnections(userId: string): Promise<MobileConnection[]>;
};

export const createConnectionsApi = (legacyClient: LegacyMobileClientPort): ConnectionsApi => ({
  connect: async (userId, data) => {
    const coachProfileId = await resolveCoachId(userId);
    const signin = await legacyClient.signin(data.email, data.password);
    const encryptedToken = encrypt(signin.accessToken);
    const expiresAt = deriveTokenExpiry(signin.accessToken, new Date());

    const connectionData = {
      encryptedToken,
      legacyUserId: signin.userId,
      legacyUserName: data.email,
      legacyUserRole: signin.userRoleName,
      expiresAt,
    };

    try {
      const connection = await prisma.mobileConnection.upsert({
        where: { coachProfileId },
        create: { coachProfileId, ...connectionData },
        update: connectionData,
      });

      logger.info("mobile.connect", {
        coachId: coachProfileId,
        legacyUserId: connection.legacyUserId,
        expiresAt: connection.expiresAt.toISOString(),
      });

      return mapToMobileConnection(connection);
    } catch (error) {
      return handlePrismaError(error, { entity: "Mobile connection" });
    }
  },

  listConnections: async (userId) => {
    const coachProfileId = await resolveCoachId(userId);
    const connections = await prisma.mobileConnection.findMany({
      where: { coachProfileId },
      orderBy: { createdAt: "desc" },
    });

    return connections.map(mapToMobileConnection);
  },
});
