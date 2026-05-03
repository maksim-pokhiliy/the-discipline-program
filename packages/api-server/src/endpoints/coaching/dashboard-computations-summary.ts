import type { Prisma, PrismaClient } from "@prisma/client";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { type AthleteDailySummary, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";

import type { AssignedAthleteWithData } from "./assigned-athlete-query";

type Db = PrismaClient | Prisma.TransactionClient;

const buildLatestSessionMap = async (
  db: Db,
  athleteIds: string[],
): Promise<Map<string, Date | null>> => {
  if (athleteIds.length === 0) {
    return new Map();
  }

  const rows = await db.workoutSession.findMany({
    where: { userId: { in: athleteIds }, completedAt: { not: null } },
    distinct: ["userId"],
    orderBy: [{ userId: "asc" }, { completedAt: "desc" }],
    select: { userId: true, completedAt: true },
  });

  const result = new Map<string, Date | null>();

  for (const id of athleteIds) {
    result.set(id, null);
  }

  for (const r of rows) {
    result.set(r.userId, r.completedAt);
  }

  return result;
};

const buildAthleteSummary = (
  assignment: AssignedAthleteWithData,
  lastActivityDate: Date | null,
): AthleteDailySummary => {
  const athlete = assignment.athlete;

  const healthStatus = athlete.athleteProfile
    ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
    : HealthStatus.HEALTHY;

  return {
    userId: athlete.id,
    name: athlete.name,
    email: athlete.email,
    image: athlete.image,
    planId: null,
    planName: null,
    todayStatus: TodayStatus.NO_SCHEDULE,
    missedCount: 0,
    todayWorkoutTitle: null,
    lastActivityDate,
    daysSinceLastActivity: null,
    healthStatus,
  };
};

export const computeAthletesSummary = async ({
  db,
  assignments,
}: {
  db: Db;
  assignments: AssignedAthleteWithData[];
}): Promise<AthleteDailySummary[]> => {
  const athleteIds = assignments.map((a) => a.athlete.id);
  const latestByAthleteId = await buildLatestSessionMap(db, athleteIds);

  const summaries: AthleteDailySummary[] = [];

  for (const a of assignments) {
    const lastActivityDate = latestByAthleteId.get(a.athlete.id) ?? null;

    summaries.push(buildAthleteSummary(a, lastActivityDate));
  }

  return summaries;
};
