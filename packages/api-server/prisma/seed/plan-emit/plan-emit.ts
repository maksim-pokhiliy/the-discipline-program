import { type DayOfWeek, type PrismaClient, TrainingPlanStatus } from "@prisma/client";

import { daysAgo } from "../_helpers";
import { requireId } from "../_id-helpers";
import { type CanonicalSeed, type CanonicalSession } from "../plan-data/canonical-schema";

import { type Phase7Example, phase7WeekIndex, stampPhase7ExamplesOrder } from "./phase7-helpers";

const DEMO_PLAN_CREATED_DAYS_AGO = 120;
const DAY_MS = 86_400_000;
const PHASE_7_OFFSET_PADDING_WEEKS = 1;

export type SessionRefMap = Map<string, string>;

export const buildSessionKey = (
  weekIndex: number,
  dayOfWeek: DayOfWeek,
  sessionOrder: number,
): string => `${weekIndex}|${dayOfWeek}|${sessionOrder}`;

const startOfWeekMonday = (date: Date): Date => {
  const day = date.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offsetToMonday),
  );
};

const weekStartDate = (baseMonday: Date, weekOffsetWeeks: number): Date =>
  new Date(baseMonday.getTime() + weekOffsetWeeks * 7 * DAY_MS);

const createTrainingPlan = async (
  db: PrismaClient,
  seed: CanonicalSeed,
  coachId: string,
): Promise<string> => {
  const description =
    seed.plan.description === null ? `Plan for ${seed.plan.athleteName}.` : seed.plan.description;

  const plan = await db.trainingPlan.create({
    data: {
      creatorId: coachId,
      name: seed.plan.title,
      description,
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(DEMO_PLAN_CREATED_DAYS_AGO),
    },
  });

  return requireId(plan);
};

type EmitWeekInput = {
  planId: string;
  weekIndex: number;
  startDate: Date;
  notes: string | null;
  days: ReadonlyArray<{
    dayOfWeek: DayOfWeek;
    labelId: string | null;
    notes: string | null;
    sessions: ReadonlyArray<CanonicalSession>;
  }>;
};

type EmitContext = {
  db: PrismaClient;
  labels: ReadonlyMap<string, string>;
  sessionRefs: SessionRefMap;
};

const emitSession = async (
  ctx: EmitContext,
  dayId: string,
  session: CanonicalSession,
  weekIndex: number,
  dayOfWeek: DayOfWeek,
): Promise<void> => {
  const labelId = session.label === null ? null : (ctx.labels.get(session.label) ?? null);
  const created = await ctx.db.session.create({
    data: {
      dayId,
      order: session.order,
      labelId,
      notes: session.notes,
    },
  });

  ctx.sessionRefs.set(buildSessionKey(weekIndex, dayOfWeek, session.order), requireId(created));
};

const emitDay = async (
  ctx: EmitContext,
  weekId: string,
  weekIndex: number,
  day: EmitWeekInput["days"][number],
): Promise<void> => {
  const created = await ctx.db.day.create({
    data: {
      weekId,
      dayOfWeek: day.dayOfWeek,
      labelId: day.labelId,
      notes: day.notes,
    },
  });

  const dayId = requireId(created);

  for (const session of day.sessions) {
    await emitSession(ctx, dayId, session, weekIndex, day.dayOfWeek);
  }
};

const emitWeek = async (ctx: EmitContext, input: EmitWeekInput): Promise<void> => {
  const week = await ctx.db.week.create({
    data: {
      planId: input.planId,
      startDate: input.startDate,
      notes: input.notes,
    },
  });

  const weekId = requireId(week);

  for (const day of input.days) {
    await emitDay(ctx, weekId, input.weekIndex, day);
  }
};

const resolveLabel = (labels: ReadonlyMap<string, string>, ref: string | null): string | null =>
  ref === null ? null : (labels.get(ref) ?? null);

const buildSheetWeekInput = (
  planId: string,
  baseMonday: Date,
  week: CanonicalSeed["weeks"][number],
  labels: ReadonlyMap<string, string>,
): EmitWeekInput => ({
  planId,
  weekIndex: week.weekIndex,
  startDate: weekStartDate(baseMonday, week.weekOffsetFromTodayWeeks),
  notes: week.notes,
  days: week.days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    labelId: resolveLabel(labels, day.label),
    notes: day.notes,
    sessions: day.sessions,
  })),
});

const groupPhase7ByDayOfWeek = (
  examples: ReadonlyArray<Phase7Example>,
): Map<DayOfWeek, Phase7Example[]> => {
  const grouped = new Map<DayOfWeek, Phase7Example[]>();

  for (const example of examples) {
    const bucket = grouped.get(example.dayOfWeek);

    if (bucket === undefined) {
      grouped.set(example.dayOfWeek, [example]);
    } else {
      bucket.push(example);
    }
  }

  return grouped;
};

const buildPhase7WeekInput = (
  planId: string,
  baseMonday: Date,
  weekIndex: number,
  weekOffsetWeeks: number,
  examples: ReadonlyArray<Phase7Example>,
): EmitWeekInput => {
  const grouped = groupPhase7ByDayOfWeek(examples);
  const days: EmitWeekInput["days"] = [...grouped.entries()].map(([dayOfWeek, items]) => ({
    dayOfWeek,
    labelId: null,
    notes: null,
    sessions: items.map((item) => ({
      order: item.order,
      label: item.label,
      notes: item.notes,
      blocks: item.blocks,
    })),
  }));

  return {
    planId,
    weekIndex,
    startDate: weekStartDate(baseMonday, weekOffsetWeeks),
    notes: "Phase 7 conceptual examples (out-of-sample)",
    days,
  };
};

export const seedCanonicalPlanShell = async (
  db: PrismaClient,
  seed: CanonicalSeed,
  coachId: string,
  labels: ReadonlyMap<string, string>,
): Promise<{ demoPlanId: string; sessionRefs: SessionRefMap }> => {
  const demoPlanId = await createTrainingPlan(db, seed, coachId);
  const baseMonday = startOfWeekMonday(new Date());
  const sessionRefs: SessionRefMap = new Map();
  const ctx: EmitContext = { db, labels, sessionRefs };

  const sortedWeeks = [...seed.weeks].sort((a, b) => a.weekIndex - b.weekIndex);

  for (const week of sortedWeeks) {
    await emitWeek(ctx, buildSheetWeekInput(demoPlanId, baseMonday, week, labels));
  }

  if (seed.phase7Examples.length > 0) {
    const maxSheetOffset = sortedWeeks.reduce(
      (max, w) => Math.max(max, w.weekOffsetFromTodayWeeks),
      Number.NEGATIVE_INFINITY,
    );
    const phase7Offset = maxSheetOffset + PHASE_7_OFFSET_PADDING_WEEKS;
    const stampedExamples = stampPhase7ExamplesOrder(seed.phase7Examples);

    await emitWeek(
      ctx,
      buildPhase7WeekInput(
        demoPlanId,
        baseMonday,
        phase7WeekIndex(seed),
        phase7Offset,
        stampedExamples,
      ),
    );
  }

  console.log(
    `  plan: planId=${demoPlanId}, ${sortedWeeks.length} sheet weeks + ${seed.phase7Examples.length > 0 ? 1 : 0} phase-7 week, ${sessionRefs.size} sessions`,
  );

  return { demoPlanId, sessionRefs };
};
