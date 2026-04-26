import type { PrismaClient } from "@prisma/client";

export interface AggregateWeeklyVolumeInput {
  db: PrismaClient;
  userId: string;
  weekStartDate: Date;
}

export interface AggregateWeeklyVolumeResult {
  totalTonnageKg: number;
  tonnageByPattern: Record<string, number>;
  recomputedAt: Date;
}

export async function aggregateWeeklyVolume(
  _input: AggregateWeeklyVolumeInput,
): Promise<AggregateWeeklyVolumeResult> {
  throw new Error(
    "weekly-volume-aggregator: not implemented in M0 — see ADR-0028 and docs/design/workout-redesign.md §6.4",
  );
}
