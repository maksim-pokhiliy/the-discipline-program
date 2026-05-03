import { type Prisma, type PrismaClient, type WeeklyVolume } from "@prisma/client";

export interface AggregateWeeklyVolumeInput {
  db: PrismaClient | Prisma.TransactionClient;
  userId: string;
  weekStartDate: Date;
  timezone?: string;
}

export async function aggregateWeeklyVolume(
  input: AggregateWeeklyVolumeInput,
): Promise<WeeklyVolume> {
  const { db, userId, weekStartDate } = input;
  const recomputedAt = new Date();

  return db.weeklyVolume.upsert({
    where: { userId_weekStartDate: { userId, weekStartDate } },
    create: {
      userId,
      weekStartDate,
      totalTonnageKg: 0,
      tonnageByPattern: {} as Prisma.InputJsonValue,
      workoutsScheduled: 0,
      workoutsFullyCompleted: 0,
      workoutsPartiallyCompleted: 0,
      workoutsMissed: 0,
      workoutsRx: 0,
      workoutsScaled: 0,
      totalDurationSec: 0,
      recomputedAt,
    },
    update: {
      totalTonnageKg: 0,
      tonnageByPattern: {} as Prisma.InputJsonValue,
      workoutsScheduled: 0,
      workoutsFullyCompleted: 0,
      workoutsPartiallyCompleted: 0,
      workoutsMissed: 0,
      workoutsRx: 0,
      workoutsScaled: 0,
      totalDurationSec: 0,
      recomputedAt,
    },
  });
}
