import { afterEach, describe, expect, it } from "vitest";

import { ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import { prisma, prismaAsCore } from "../../db/client";
import { cleanupRaw } from "../../test/helpers";

import { buildAssignedAthleteInclude } from "./assigned-athlete-query";
import { computeProgressBuckets } from "./dashboard-computations";
import { cleanup, createCoachWithAthleteSessions } from "./dashboard-computations.test-helpers";

const loadAssignments = (coachProfileId: string, coachUserId: string) =>
  prisma.coachAthleteAssignment.findMany({
    where: { coachId: coachProfileId },
    include: buildAssignedAthleteInclude(coachUserId),
  });

describe("computeProgressBuckets", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterEach(async () => {
    await cleanup(...toCleanup.splice(0));
  });

  it("puts athlete with 3 fully-completed sessions into onTrack bucket", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 3,
      completionRatios: [1.0, 1.0, 1.0],
    });

    toCleanup.push(...c);

    const assignments = await loadAssignments(coachProfileId, coachId);
    const result = await computeProgressBuckets({ db: prismaAsCore, assignments });

    const ids = result.onTrack.map((a) => a.userId);

    expect(ids).toContain(athlete.athleteId);
    expect(result.steady.map((a) => a.userId)).not.toContain(athlete.athleteId);
    expect(result.fallingBehind.map((a) => a.userId)).not.toContain(athlete.athleteId);
  });

  it("puts athlete with 50% adherence into steady bucket", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 4,
      completionRatios: [1.0, 1.0, 0.0, 0.0],
    });

    toCleanup.push(...c);

    const assignments = await loadAssignments(coachProfileId, coachId);
    const result = await computeProgressBuckets({ db: prismaAsCore, assignments });

    const steadyIds = result.steady.map((a) => a.userId);

    expect(steadyIds).toContain(athlete.athleteId);
    expect(result.onTrack.map((a) => a.userId)).not.toContain(athlete.athleteId);
    expect(result.fallingBehind.map((a) => a.userId)).not.toContain(athlete.athleteId);
  });

  it("puts athlete with all missed sessions into fallingBehind bucket", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 3,
      completionRatios: [0.0, 0.1, 0.2],
    });

    toCleanup.push(...c);

    const assignments = await loadAssignments(coachProfileId, coachId);
    const result = await computeProgressBuckets({ db: prismaAsCore, assignments });

    const fallingIds = result.fallingBehind.map((a) => a.userId);

    expect(fallingIds).toContain(athlete.athleteId);
    expect(result.onTrack.map((a) => a.userId)).not.toContain(athlete.athleteId);
    expect(result.steady.map((a) => a.userId)).not.toContain(athlete.athleteId);
  });

  it("returns all empty buckets and zero engagement for empty assignments list", async () => {
    const result = await computeProgressBuckets({ db: prismaAsCore, assignments: [] });

    expect(result.onTrack).toHaveLength(0);
    expect(result.steady).toHaveLength(0);
    expect(result.fallingBehind).toHaveLength(0);
    expect(result.avgEngagementRate).toBe(0);
  });

  it("processStatus on entry matches bucket placement", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 3,
      completionRatios: [1.0, 1.0, 1.0],
    });

    toCleanup.push(...c);

    const assignments = await loadAssignments(coachProfileId, coachId);
    const result = await computeProgressBuckets({ db: prismaAsCore, assignments });

    const entry = result.onTrack.find((a) => a.userId === athlete.athleteId);

    expect(entry).toBeDefined();
    expect(entry?.processStatus).toBe(ProcessStatus.ON_TRACK);
  });
});

describe("MISSED_WORKOUTS action items via reconcile", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterEach(async () => {
    await cleanup(...toCleanup.splice(0));
  });

  it("creates MISSED_WORKOUTS action item for athlete with poor adherence", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 3,
      completionRatios: [0.1, 0.0, 0.2],
    });

    toCleanup.push(...c);

    const { coachingCoachActionItemApi } = await import("./coach-action-item");

    await coachingCoachActionItemApi.reconcile(coachId);

    const items = await cleanupRaw.coachActionItem.findMany({
      where: {
        coachId: coachProfileId,
        athleteId: athlete.athleteId,
        type: ActionItemType.MISSED_WORKOUTS,
      },
    });

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]?.status).toBe("OPEN");

    await cleanupRaw.coachActionItem.deleteMany({ where: { coachId: coachProfileId } });
  });

  it("does not create MISSED_WORKOUTS for athlete with good adherence", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 3,
      completionRatios: [1.0, 1.0, 1.0],
    });

    toCleanup.push(...c);

    const { coachingCoachActionItemApi } = await import("./coach-action-item");

    await coachingCoachActionItemApi.reconcile(coachId);

    const items = await cleanupRaw.coachActionItem.findMany({
      where: {
        coachId: coachProfileId,
        athleteId: athlete.athleteId,
        type: ActionItemType.MISSED_WORKOUTS,
      },
    });

    expect(items).toHaveLength(0);

    await cleanupRaw.coachActionItem.deleteMany({ where: { coachId: coachProfileId } });
  });

  it("is idempotent — running reconcile twice creates only one MISSED_WORKOUTS item", async () => {
    const {
      coachId,
      coachProfileId,
      athlete,
      toCleanup: c,
    } = await createCoachWithAthleteSessions({
      sessionsCount: 2,
      completionRatios: [0.0, 0.1],
    });

    toCleanup.push(...c);

    const { coachingCoachActionItemApi } = await import("./coach-action-item");

    await coachingCoachActionItemApi.reconcile(coachId);
    await coachingCoachActionItemApi.reconcile(coachId);

    const items = await cleanupRaw.coachActionItem.findMany({
      where: {
        coachId: coachProfileId,
        athleteId: athlete.athleteId,
        type: ActionItemType.MISSED_WORKOUTS,
        status: "OPEN",
      },
    });

    expect(items).toHaveLength(1);

    await cleanupRaw.coachActionItem.deleteMany({ where: { coachId: coachProfileId } });
  });
});
