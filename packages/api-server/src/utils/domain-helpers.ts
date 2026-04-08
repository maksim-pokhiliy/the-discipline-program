import type { HealthStatus as PrismaHealthStatus } from "@prisma/client";

import { HealthStatus } from "@repo/contracts/athlete-profile";

import { prisma } from "../db/client";
import { HEALTH_STATUS_MAP } from "../mappers/enum-maps";

import { findOrThrow } from "./find-or-throw";

export const getLatestLog = <T extends { date: Date }>(logs: T[]): T | null =>
  logs.length > 0 ? logs.reduce((latest, l) => (l.date > latest.date ? l : latest)) : null;

export const resolveHealthStatus = (
  athleteProfile: { healthStatus: PrismaHealthStatus } | null,
): HealthStatus =>
  athleteProfile ? HEALTH_STATUS_MAP[athleteProfile.healthStatus] : HealthStatus.HEALTHY;

export const getCoachTimezone = async (userId: string): Promise<string> => {
  const user = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    "User",
  );

  return user.timezone;
};
