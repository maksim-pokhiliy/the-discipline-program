import { afterAll, describe, expect, it } from "vitest";

import type { LegacyShimIdentity } from "@repo/api-routes/legacy-shim";

import {
  LEGACY_LEVEL_PRO,
  LEGACY_PLAN_GENERAL,
  LEGACY_PLAN_INDIVIDUAL,
  LEGACY_ROLE_USER,
} from "../../test/golden-fixture";
import { cleanupRaw } from "../../test/helpers";
import {
  createTestPublishedSnapshot,
  type TestPublishedSnapshot,
} from "../../test/published-snapshot";

import { createGetProgramApi } from "./get-program";

const api = createGetProgramApi();

const snapshots: TestPublishedSnapshot[] = [];

const track = async (pending: Promise<TestPublishedSnapshot>): Promise<TestPublishedSnapshot> => {
  const snapshot = await pending;

  snapshots.push(snapshot);

  return snapshot;
};

const utcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const TRAINING_PROGRAM = {
  dayTrainings: [
    { trainingNumber: 1, blocks: [{ name: "WOD", exercises: ["21-15-9 thrusters"] }] },
  ],
};

const identity = (
  overrides: Partial<LegacyShimIdentity> & { legacyUserId: number },
): LegacyShimIdentity => ({
  userId: `user-${overrides.legacyUserId}`,
  legacyRoleId: LEGACY_ROLE_USER,
  legacyPlanId: LEGACY_PLAN_GENERAL,
  legacyLevelId: LEGACY_LEVEL_PRO,
  ...overrides,
});

describe("mobile shim get program", () => {
  afterAll(async () => {
    await cleanupRaw.mobileConnection.deleteMany({
      where: { id: { in: snapshots.map((snapshot) => snapshot.connectionId) } },
    });
    await cleanupRaw.trainingPlan.deleteMany({
      where: { id: { in: snapshots.map((snapshot) => snapshot.planId) } },
    });
    await cleanupRaw.user.deleteMany({
      where: {
        id: {
          in: snapshots.flatMap((snapshot) =>
            snapshot.athleteUserId
              ? [snapshot.coachUserId, snapshot.athleteUserId]
              : [snapshot.coachUserId],
          ),
        },
      },
    });
  });

  it("serves the athlete's own general training day in the legacy shape", async () => {
    const legacyUserId = 500001;
    const snapshot = await track(
      createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_PRO,
        scheduledDate: utcDate("2026-08-15"),
        legacyRowId: 11,
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
      }),
    );

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyLevelId: LEGACY_LEVEL_PRO }),
        legacyUserId,
        "2026-08-15",
      ),
    ).toEqual({
      kind: "ok-json",
      payload: {
        id: snapshot.legacyRowId,
        scheduledDate: "2026-08-15",
        trainingLevel: { id: LEGACY_LEVEL_PRO, name: "Pro" },
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
      },
    });
  });

  it("serves a general rest day as isRestDay true with a null dailyProgram", async () => {
    const legacyUserId = 500002;

    await track(
      createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_PRO,
        scheduledDate: utcDate("2026-08-16"),
        legacyRowId: 12,
        isRestDay: true,
        dailyProgram: null,
      }),
    );

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyLevelId: LEGACY_LEVEL_PRO }),
        legacyUserId,
        "2026-08-16",
      ),
    ).toEqual({
      kind: "ok-json",
      payload: {
        id: 12,
        scheduledDate: "2026-08-16",
        trainingLevel: { id: LEGACY_LEVEL_PRO, name: "Pro" },
        isRestDay: true,
        dailyProgram: null,
      },
    });
  });

  it("serves an individual day keyed by the athlete's legacyUserId, carrying the userId field", async () => {
    const legacyUserId = 500003;

    await track(
      createTestPublishedSnapshot({
        channel: "INDIVIDUAL",
        legacyUserId,
        scheduledDate: utcDate("2026-08-17"),
        legacyRowId: 13,
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
      }),
    );

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyPlanId: LEGACY_PLAN_INDIVIDUAL }),
        legacyUserId,
        "2026-08-17",
      ),
    ).toEqual({
      kind: "ok-json",
      payload: {
        id: 13,
        userId: legacyUserId,
        scheduledDate: "2026-08-17",
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
      },
    });
  });

  it("routes a plan-2 identity to the individual channel, never the general one on the same date", async () => {
    const legacyUserId = 500004;
    const individualProgram = {
      dayTrainings: [
        { trainingNumber: 1, blocks: [{ name: "GYMNASTICS", exercises: ["muscle-ups"] }] },
      ],
    };

    await track(
      createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_PRO,
        scheduledDate: utcDate("2026-08-18"),
        legacyRowId: 141,
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
      }),
    );
    await track(
      createTestPublishedSnapshot({
        channel: "INDIVIDUAL",
        legacyUserId,
        scheduledDate: utcDate("2026-08-18"),
        legacyRowId: 142,
        isRestDay: false,
        dailyProgram: individualProgram,
      }),
    );

    expect(
      await api.getProgram(
        identity({
          legacyUserId,
          legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
          legacyLevelId: LEGACY_LEVEL_PRO,
        }),
        legacyUserId,
        "2026-08-18",
      ),
    ).toEqual({
      kind: "ok-json",
      payload: {
        id: 142,
        userId: legacyUserId,
        scheduledDate: "2026-08-18",
        isRestDay: false,
        dailyProgram: individualProgram,
      },
    });
  });

  it("returns the latest-published snapshot when two general links publish the same level and date", async () => {
    const legacyUserId = 500005;
    const winner = {
      dayTrainings: [
        { trainingNumber: 1, blocks: [{ name: "STRENGTH", exercises: ["back squat"] }] },
      ],
    };

    await track(
      createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_PRO,
        scheduledDate: utcDate("2026-08-19"),
        legacyRowId: 151,
        isRestDay: false,
        dailyProgram: TRAINING_PROGRAM,
        publishedAt: utcDate("2026-08-01"),
      }),
    );
    await track(
      createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_PRO,
        scheduledDate: utcDate("2026-08-19"),
        legacyRowId: 152,
        isRestDay: false,
        dailyProgram: winner,
        publishedAt: utcDate("2026-08-10"),
      }),
    );

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyLevelId: LEGACY_LEVEL_PRO }),
        legacyUserId,
        "2026-08-19",
      ),
    ).toEqual({
      kind: "ok-json",
      payload: {
        id: 152,
        scheduledDate: "2026-08-19",
        trainingLevel: { id: LEGACY_LEVEL_PRO, name: "Pro" },
        isRestDay: false,
        dailyProgram: winner,
      },
    });
  });

  it("returns not-found for another athlete's userId, never a 403 that signs the caller out", async () => {
    const legacyUserId = 500006;

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyLevelId: LEGACY_LEVEL_PRO }),
        legacyUserId + 1,
        "2026-08-15",
      ),
    ).toEqual({ kind: "not-found" });
  });

  it("returns not-found when no snapshot exists for the date", async () => {
    const legacyUserId = 500007;

    expect(
      await api.getProgram(
        identity({ legacyUserId, legacyLevelId: LEGACY_LEVEL_PRO }),
        legacyUserId,
        "2030-01-01",
      ),
    ).toEqual({ kind: "not-found" });
  });
});

describe("the rest_xor_program CHECK", () => {
  const rawSnapshots: TestPublishedSnapshot[] = [];

  afterAll(async () => {
    await cleanupRaw.mobileConnection.deleteMany({
      where: { id: { in: rawSnapshots.map((snapshot) => snapshot.connectionId) } },
    });
    await cleanupRaw.trainingPlan.deleteMany({
      where: { id: { in: rawSnapshots.map((snapshot) => snapshot.planId) } },
    });
    await cleanupRaw.user.deleteMany({
      where: { id: { in: rawSnapshots.map((snapshot) => snapshot.coachUserId) } },
    });
  });

  const seedLink = async (): Promise<string> => {
    const snapshot = await createTestPublishedSnapshot({
      channel: "GENERAL",
      legacyLevelId: LEGACY_LEVEL_PRO,
      scheduledDate: utcDate("2026-08-21"),
      legacyRowId: 8000 + rawSnapshots.length,
      isRestDay: true,
      dailyProgram: null,
    });

    rawSnapshots.push(snapshot);

    return snapshot.linkId;
  };

  const insertDay = (
    linkId: string,
    scheduledDate: string,
    dailyProgramSql: string,
  ): Promise<number> =>
    cleanupRaw.$executeRawUnsafe(
      `INSERT INTO app_mobile_published_days
         (id, "linkId", "scheduledDate", "legacyRowId", "contentHash", "isRestDay", "dailyProgram", "updatedAt")
       VALUES ($1, $2, $3::date, $4, $5, false, ${dailyProgramSql}, now())`,
      crypto.randomUUID(),
      linkId,
      scheduledDate,
      9000 + rawSnapshots.length,
      "raw-check-test",
    );

  it("rejects a raw insert of the fatalError state (isRestDay=false, dailyProgram=NULL)", async () => {
    const linkId = await seedLink();

    await expect(insertDay(linkId, "2026-09-01", "NULL")).rejects.toThrow(/rest_xor_program/);
  });

  it("accepts a raw insert of a valid training day (isRestDay=false, dailyProgram present)", async () => {
    const linkId = await seedLink();

    await expect(insertDay(linkId, "2026-09-02", `'{"dayTrainings":[]}'::jsonb`)).resolves.toBe(1);
  });
});
