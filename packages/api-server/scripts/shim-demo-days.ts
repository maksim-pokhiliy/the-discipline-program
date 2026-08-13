import { Prisma, type PrismaClient } from "@prisma/client";

import type { LegacyDailyProgram } from "../src/infrastructure/legacy-mobile/port";
import { MS_PER_DAY } from "../src/utils/date-helpers";
import { contentHash } from "../src/utils/hash";
import { toInputJson } from "../src/utils/to-input-json";

const WINDOW_DAYS_BACK = 3;
const WINDOW_DAYS_FORWARD = 60;
const DATE_ANCHOR = "2026-01-01";
const LEGACY_ROW_ID_BASE = 990100;
const REST_DAY_CYCLE = 4;
const REST_DAY_REMAINDER = 3;

type BlockTemplate = { name: string; exercises: string[] };

export type DayPlan = {
  isoDate: string;
  scheduledDate: Date;
  legacyRowId: number;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
  hash: string;
};

export type DayCounts = { created: number; updated: number; unchanged: number };

export const utcMidnight = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const shiftDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_PER_DAY);

const daysSinceAnchor = (date: Date): number =>
  Math.round((date.getTime() - utcMidnight(DATE_ANCHOR).getTime()) / MS_PER_DAY);

const positiveModulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

const hashableOf = (isRestDay: boolean, dailyProgram: unknown): unknown =>
  isRestDay ? { isRestDay: true } : { isRestDay: false, dailyProgram };

const TRAINING_TEMPLATES: readonly (readonly BlockTemplate[])[][] = [
  [
    [
      { name: "WARM-UP", exercises: ["3 rounds:\n10 air squats\n10 push-ups\n200 m easy row"] },
      {
        name: "STRENGTH",
        exercises: ["Back squat\n5 sets of 3 @ 80% of 1RM\nRest 2:00 between sets"],
      },
      { name: "CONDITIONING", exercises: ["For time:\n21-15-9\nThrusters 42.5 kg\nPull-ups"] },
    ],
    [
      { name: "ACCESSORY", exercises: ["4 sets:\n12 dumbbell rows each arm\n45 s hollow hold"] },
      { name: "COOL-DOWN", exercises: ["10 min easy bike\nCouch stretch 2 min each side"] },
    ],
  ],
  [
    [
      {
        name: "WARM-UP",
        exercises: ["2 rounds:\n250 m row\n10 PVC pass-throughs\n10 walking lunges"],
      },
      {
        name: "SKILL",
        exercises: ["Every 90 s for 7:30:\n3 squat snatches, building to a heavy triple"],
      },
      {
        name: "CONDITIONING",
        exercises: ["AMRAP 12:\n10 burpees over the bar\n15 wall balls 9 kg\n200 m run"],
      },
    ],
  ],
  [
    [
      {
        name: "WARM-UP",
        exercises: ["3 min easy bike\nWorld's greatest stretch 5 reps each side"],
      },
      {
        name: "STRENGTH",
        exercises: ["Deadlift\n5-5-3-3-1\nBuild to a heavy single, stop if bar speed drops"],
      },
      {
        name: "CONDITIONING",
        exercises: ["5 rounds for time:\n400 m run\n15 kettlebell swings 24 kg"],
      },
    ],
  ],
];

const buildTrainings = (isoDate: string, variant: number): LegacyDailyProgram["dayTrainings"] => {
  const template = TRAINING_TEMPLATES[positiveModulo(variant, TRAINING_TEMPLATES.length)];

  if (template === undefined) {
    throw new Error(`no training template for variant ${variant}`);
  }

  return template.map((blocks, trainingIndex) => ({
    trainingNumber: trainingIndex + 1,
    blocks: blocks.map((block, blockIndex) => ({
      name: block.name,
      exercises:
        trainingIndex === 0 && blockIndex === 0
          ? [`Session date: ${isoDate}`, ...block.exercises]
          : [...block.exercises],
    })),
  }));
};

const planDay = (date: Date): DayPlan => {
  const offset = daysSinceAnchor(date);
  const isoDate = toIsoDate(date);
  const isRestDay = positiveModulo(offset, REST_DAY_CYCLE) === REST_DAY_REMAINDER;
  const dailyProgram = isRestDay ? null : { dayTrainings: buildTrainings(isoDate, offset) };

  return {
    isoDate,
    scheduledDate: utcMidnight(isoDate),
    legacyRowId: LEGACY_ROW_ID_BASE + offset,
    isRestDay,
    dailyProgram,
    hash: contentHash(hashableOf(isRestDay, dailyProgram)),
  };
};

export const planWindow = (runDate: Date): DayPlan[] => {
  const start = shiftDays(runDate, -WINDOW_DAYS_BACK);
  const total = WINDOW_DAYS_BACK + WINDOW_DAYS_FORWARD + 1;

  return Array.from({ length: total }, (_, index) => planDay(shiftDays(start, index)));
};

type StoredDay = {
  contentHash: string;
  legacyRowId: number;
  isRestDay: boolean | null;
  dailyProgram: unknown;
};

const isRowCurrent = (stored: StoredDay, day: DayPlan): boolean => {
  if (stored.contentHash !== day.hash) {
    return false;
  }

  if (stored.legacyRowId !== day.legacyRowId || stored.isRestDay !== day.isRestDay) {
    return false;
  }

  return contentHash(hashableOf(day.isRestDay, stored.dailyProgram)) === day.hash;
};

export const upsertDays = async (
  prisma: PrismaClient,
  linkId: string,
  days: DayPlan[],
): Promise<DayCounts> => {
  const existing = await prisma.mobilePublishedDay.findMany({
    where: { linkId, scheduledDate: { in: days.map((day) => day.scheduledDate) } },
    select: {
      scheduledDate: true,
      contentHash: true,
      legacyRowId: true,
      isRestDay: true,
      dailyProgram: true,
    },
  });
  const byIsoDate = new Map(existing.map((row) => [toIsoDate(row.scheduledDate), row]));
  const counts: DayCounts = { created: 0, updated: 0, unchanged: 0 };

  for (const day of days) {
    const current = byIsoDate.get(day.isoDate);

    if (current !== undefined && isRowCurrent(current, day)) {
      counts.unchanged += 1;
      continue;
    }

    const dailyProgram = day.dailyProgram === null ? Prisma.DbNull : toInputJson(day.dailyProgram);

    await prisma.mobilePublishedDay.upsert({
      where: { linkId_scheduledDate: { linkId, scheduledDate: day.scheduledDate } },
      create: {
        linkId,
        scheduledDate: day.scheduledDate,
        legacyRowId: day.legacyRowId,
        contentHash: day.hash,
        isRestDay: day.isRestDay,
        dailyProgram,
      },
      update: {
        legacyRowId: day.legacyRowId,
        contentHash: day.hash,
        publishedAt: new Date(),
        isRestDay: day.isRestDay,
        dailyProgram,
      },
    });

    if (current === undefined) {
      counts.created += 1;
    } else {
      counts.updated += 1;
    }
  }

  return counts;
};
