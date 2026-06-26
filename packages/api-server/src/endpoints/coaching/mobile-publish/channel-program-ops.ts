import { MobilePublishChannel } from "@prisma/client";

import { InternalServerError } from "@repo/errors";

import {
  type LegacyDailyProgram,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";

export type LegacyProgramRow = {
  id: number;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyProgramWriteBody = {
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type ChannelProgramOps = {
  getProgram(scheduledDate: string): Promise<LegacyProgramRow | null>;
  createProgram(body: LegacyProgramWriteBody): Promise<LegacyProgramRow>;
  replaceProgram(body: LegacyProgramWriteBody, existingRowId: number): Promise<LegacyProgramRow>;
};

const createGeneralProgramOps = (
  legacyClient: LegacyMobileClientPort,
  token: string,
  legacyLevelId: number,
): ChannelProgramOps => ({
  getProgram: (scheduledDate) =>
    legacyClient.getGeneralProgram(token, legacyLevelId, scheduledDate),
  createProgram: (body) =>
    legacyClient.createGeneralProgram(token, { levelId: legacyLevelId, ...body }),
  replaceProgram: (body, existingRowId) =>
    legacyClient.updateGeneralProgram(token, {
      levelId: legacyLevelId,
      id: existingRowId,
      ...body,
    }),
});

const createIndividualProgramOps = (
  legacyClient: LegacyMobileClientPort,
  token: string,
  legacyUserId: number,
): ChannelProgramOps => ({
  getProgram: (scheduledDate) =>
    legacyClient.getIndividualProgram(token, legacyUserId, scheduledDate),
  createProgram: (body) =>
    legacyClient.createIndividualProgram(token, { userId: legacyUserId, ...body }),
  replaceProgram: async (body, existingRowId) => {
    await legacyClient.deleteIndividualProgram(token, existingRowId);

    return legacyClient.createIndividualProgram(token, { userId: legacyUserId, ...body });
  },
});

export const buildChannelOps = (
  legacyClient: LegacyMobileClientPort,
  token: string,
  link: {
    channel: MobilePublishChannel;
    legacyLevelId: number | null;
    legacyUserId: number | null;
  },
): ChannelProgramOps => {
  if (link.channel === MobilePublishChannel.INDIVIDUAL) {
    if (link.legacyUserId === null) {
      throw new InternalServerError("Individual link is missing legacyUserId");
    }

    return createIndividualProgramOps(legacyClient, token, link.legacyUserId);
  }

  if (link.legacyLevelId === null) {
    throw new InternalServerError("General link is missing legacyLevelId");
  }

  return createGeneralProgramOps(legacyClient, token, link.legacyLevelId);
};
