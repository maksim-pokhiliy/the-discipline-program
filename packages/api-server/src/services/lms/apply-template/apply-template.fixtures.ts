import {
  type BlockTemplatePayload,
  type SessionTemplatePayload,
  type WeekTemplatePayload,
} from "@repo/contracts/lms/_domain";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

export type ApplyFixtureBase = {
  coachUserId: string;
  coachProfileId: string;
  otherCoachUserId: string;
  otherCoachProfileId: string;
  planId: string;
  weekId: string;
  dayId: string;
  sessionId: string;
  blockKindId: string;
  exerciseId: string;
  toCleanup: { table: string; id: string }[];
};

export const buildApplyFixture = async (): Promise<ApplyFixtureBase> => {
  const toCleanup: { table: string; id: string }[] = [];

  const coach = await createTestCoach();
  const otherCoach = await createTestCoach();

  toCleanup.push(
    { table: "coachProfile", id: coach.profile.id },
    { table: "user", id: coach.user.id },
    { table: "coachProfile", id: otherCoach.profile.id },
    { table: "user", id: otherCoach.user.id },
  );

  const blockKind = await cleanupRaw.blockKind.create({
    data: {
      scope: "SYSTEM",
      name: `BK Apply ${crypto.randomUUID().slice(0, 8)}`,
      defaultWeight: 1,
    },
  });

  toCleanup.push({ table: "blockKind", id: blockKind.id });

  const exercise = await cleanupRaw.exerciseLibraryItem.create({
    data: {
      scope: "SYSTEM",
      name: `Ex Apply ${crypto.randomUUID().slice(0, 8)}`,
      primaryMovement: "SQUAT",
      modality: "BARBELL",
      primaryBodyParts: ["QUADS"],
      defaultMetrics: {
        canMeasureLoad: true,
        canMeasureReps: true,
        canMeasureDuration: false,
        canMeasureDistance: false,
        canMeasureCalories: false,
      },
    },
  });

  toCleanup.push({ table: "exerciseLibraryItem", id: exercise.id });

  const plan = await createTestPlan(coach.user.id);

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const week = await cleanupRaw.week.create({ data: { planId: plan.id, index: 0 } });
  const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });
  const session = await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } });

  return {
    coachUserId: coach.user.id,
    coachProfileId: coach.profile.id,
    otherCoachUserId: otherCoach.user.id,
    otherCoachProfileId: otherCoach.profile.id,
    planId: plan.id,
    weekId: week.id,
    dayId: day.id,
    sessionId: session.id,
    blockKindId: blockKind.id,
    exerciseId: exercise.id,
    toCleanup,
  };
};

export const makeBlockPayload = (
  blockKindId: string,
  exerciseId: string,
): BlockTemplatePayload => ({
  block: {
    order: 0,
    kindId: blockKindId,
    title: "Sample Block",
    status: "ACTIVE",
    weight: 1,
    notes: null,
  },
  segments: [
    {
      order: 0,
      label: null,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
      schemeTemplateId: null,
      restConfig: null,
      setGroups: [
        {
          order: 0,
          label: null,
          restConfig: null,
          entries: [
            {
              order: 0,
              exerciseId,
              exerciseSnapshot: {
                id: exerciseId,
                name: "Sample",
                primaryMovement: "SQUAT",
                modality: "BARBELL",
                primaryBodyParts: ["QUADS"],
                defaultMetrics: {
                  canMeasureLoad: true,
                  canMeasureReps: true,
                  canMeasureDuration: false,
                  canMeasureDistance: false,
                  canMeasureCalories: false,
                },
                demoVideoUrl: null,
                demoImageUrl: null,
              },
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
              alternatives: [],
              externalUrl: null,
              notes: null,
            },
          ],
        },
      ],
    },
  ],
});

export const makeSessionPayload = (
  blockKindId: string,
  exerciseId: string,
): SessionTemplatePayload => ({
  session: {
    order: 0,
    label: "Sample Session",
    notes: null,
  },
  blocks: [makeBlockPayload(blockKindId, exerciseId)],
});

export const makeWeekPayload = (blockKindId: string, exerciseId: string): WeekTemplatePayload => ({
  week: {
    label: "Sample Week",
    notes: null,
  },
  days: [
    {
      dayOfWeek: "MON",
      kind: "TRAINING",
      notes: null,
      sessions: [makeSessionPayload(blockKindId, exerciseId)],
    },
  ],
});
