import { Prisma } from "@prisma/client";

import { type LegacyDailyProgram } from "../infrastructure/legacy-mobile";
import { toInputJson } from "../utils/to-input-json";

import { cleanupRaw, createTestCoach, createTestPlan, createTestUser } from "./helpers";

const SNAPSHOT_CONTENT_HASH = "test-snapshot-content-hash";
const CONNECTION_TTL_MS = 60 * 60 * 1000;

export type TestPublishedSnapshotInput = {
  scheduledDate: Date;
  legacyRowId: number;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
  publishedAt?: Date;
} & (
  | { channel: "GENERAL"; legacyLevelId: number }
  | { channel: "INDIVIDUAL"; legacyUserId: number }
);

export type TestPublishedSnapshot = {
  coachUserId: string;
  coachProfileId: string;
  athleteUserId: string | null;
  planId: string;
  connectionId: string;
  linkId: string;
  dayId: string;
  legacyRowId: number;
};

export const createTestPublishedSnapshot = async (
  input: TestPublishedSnapshotInput,
): Promise<TestPublishedSnapshot> => {
  const coach = await createTestCoach();
  const plan = await createTestPlan(coach.user.id);

  const connection = await cleanupRaw.mobileConnection.create({
    data: {
      coachProfileId: coach.profile.id,
      encryptedToken: "test-encrypted-token",
      legacyUserId: "1",
      legacyUserName: "coach@tdp.local",
      legacyUserRole: "ADMIN",
      expiresAt: new Date(Date.now() + CONNECTION_TTL_MS),
    },
  });

  const athleteUserId = input.channel === "INDIVIDUAL" ? (await createTestUser()).id : null;

  const link = await cleanupRaw.mobilePublishLink.create({
    data:
      input.channel === "INDIVIDUAL"
        ? {
            connectionId: connection.id,
            planId: plan.id,
            channel: "INDIVIDUAL",
            legacyUserId: input.legacyUserId,
            athleteId: athleteUserId,
          }
        : {
            connectionId: connection.id,
            planId: plan.id,
            channel: "GENERAL",
            legacyLevelId: input.legacyLevelId,
          },
  });

  const day = await cleanupRaw.mobilePublishedDay.create({
    data: {
      linkId: link.id,
      scheduledDate: input.scheduledDate,
      legacyRowId: input.legacyRowId,
      contentHash: SNAPSHOT_CONTENT_HASH,
      isRestDay: input.isRestDay,
      dailyProgram: input.dailyProgram === null ? Prisma.DbNull : toInputJson(input.dailyProgram),
      ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
    },
  });

  return {
    coachUserId: coach.user.id,
    coachProfileId: coach.profile.id,
    athleteUserId,
    planId: plan.id,
    connectionId: connection.id,
    linkId: link.id,
    dayId: day.id,
    legacyRowId: input.legacyRowId,
  };
};
