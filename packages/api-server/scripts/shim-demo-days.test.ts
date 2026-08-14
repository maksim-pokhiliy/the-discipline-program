import { Prisma, type PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it, vi } from "vitest";

import { legacyDailyProgramSchema } from "../src/endpoints/mobile-compat/wire-schemas";

import { type DayPlan, planWindow, toIsoDate, upsertDays, utcMidnight } from "./shim-demo-days";

const TZ_ENV_KEY = "TZ";
const NEVER_UTC_TZ = "Pacific/Chatham";

vi.stubEnv(TZ_ENV_KEY, NEVER_UTC_TZ);

afterAll(() => {
  vi.unstubAllEnvs();
});

const WINDOW_SIZE = 64;
const REST_CYCLE = 4;
const RUN_DATE = "2026-08-13";
const LINK_ID = "cln_demo_link";

const windowFor = (isoDate: string) => planWindow(utcMidnight(isoDate));

describe("planWindow", () => {
  it("spans the run date minus three through plus sixty", () => {
    const days = windowFor(RUN_DATE);

    expect(days).toHaveLength(WINDOW_SIZE);
    expect(days.at(0)?.isoDate).toBe("2026-08-10");
    expect(days.at(-1)?.isoDate).toBe("2026-10-12");
  });

  it("emits consecutive calendar days with no gap or repeat", () => {
    const isoDates = windowFor("2026-02-27").map((day) => day.isoDate);

    expect(new Set(isoDates).size).toBe(WINDOW_SIZE);
    expect(isoDates).toContain("2026-03-01");
  });

  it("rests on every fourth day, counted from the anchor rather than the run date", () => {
    const days = windowFor(RUN_DATE);
    const restCount = days.filter((day) => day.isRestDay).length;

    expect(restCount).toBe(WINDOW_SIZE / REST_CYCLE);
    expect(days.filter((day) => day.isRestDay).map((day) => day.isoDate)).toContain("2026-08-16");
  });

  it("keeps a calendar date identical no matter which run date produced it", () => {
    const early = windowFor(RUN_DATE);
    const late = windowFor("2026-09-20");
    const overlap = new Map(late.map((day) => [day.isoDate, day]));

    const shared = early.filter((day) => overlap.has(day.isoDate));

    expect(shared.length).toBeGreaterThan(0);

    for (const day of shared) {
      const other = overlap.get(day.isoDate);

      expect(other?.legacyRowId).toBe(day.legacyRowId);
      expect(other?.isRestDay).toBe(day.isRestDay);
      expect(other?.hash).toBe(day.hash);
    }
  });

  it("holds the rest cadence for dates before the anchor", () => {
    const days = windowFor("2025-12-30");
    const restDates = days.filter((day) => day.isRestDay).map((day) => day.isoDate);

    expect(restDates).toContain("2025-12-27");
    expect(restDates).toContain("2025-12-31");
  });

  it("derives legacyRowId from the calendar date", () => {
    const [first] = windowFor("2026-01-04");

    expect(first?.isoDate).toBe("2026-01-01");
    expect(first?.legacyRowId).toBe(990100);
  });

  it("gives rest days a null program and training days a schema-valid one", () => {
    for (const day of windowFor(RUN_DATE)) {
      if (day.isRestDay) {
        expect(day.dailyProgram).toBeNull();
        continue;
      }

      expect(legacyDailyProgramSchema.safeParse(day.dailyProgram).success).toBe(true);
      expect(day.dailyProgram?.dayTrainings.length).toBeGreaterThan(0);
    }
  });

  it("stamps each training day's own date as the first exercise line", () => {
    for (const day of windowFor(RUN_DATE)) {
      if (day.isRestDay) {
        continue;
      }

      expect(day.dailyProgram?.dayTrainings.at(0)?.blocks.at(0)?.exercises.at(0)).toBe(
        `Session date: ${day.isoDate}`,
      );
    }
  });

  it("pins scheduledDate to UTC midnight so the @db.Date column round-trips", () => {
    expect(new Date().getTimezoneOffset()).not.toBe(0);

    for (const day of windowFor(RUN_DATE)) {
      expect(day.scheduledDate.toISOString()).toBe(`${day.isoDate}T00:00:00.000Z`);
      expect(toIsoDate(day.scheduledDate)).toBe(day.isoDate);
    }
  });

  it("distinguishes training days from one another but collapses rest days", () => {
    const days = windowFor(RUN_DATE);
    const trainingHashes = new Set(days.filter((d) => !d.isRestDay).map((d) => d.hash));
    const restHashes = new Set(days.filter((d) => d.isRestDay).map((d) => d.hash));

    expect(trainingHashes.size).toBe(days.filter((d) => !d.isRestDay).length);
    expect(restHashes.size).toBe(1);
  });
});

type StoredRow = {
  scheduledDate: Date;
  contentHash: string;
  legacyRowId: number;
  isRestDay: boolean | null;
  dailyProgram: unknown;
};

type FindManyArgs = { where: { linkId: string; scheduledDate: { in: Date[] } } };

type UpsertArgs = {
  where: { linkId_scheduledDate: { linkId: string; scheduledDate: Date } };
  create: {
    linkId: string;
    scheduledDate: Date;
    legacyRowId: number;
    contentHash: string;
    isRestDay: boolean;
    dailyProgram: unknown;
  };
  update: {
    legacyRowId: number;
    contentHash: string;
    publishedAt: Date;
    isRestDay: boolean;
    dailyProgram: unknown;
  };
};

type FakeDb = { client: PrismaClient; finds: FindManyArgs[]; upserts: UpsertArgs[] };

const fakeDb = (rows: StoredRow[]): FakeDb => {
  const finds: FindManyArgs[] = [];
  const upserts: UpsertArgs[] = [];
  const mobilePublishedDay = {
    findMany: (args: FindManyArgs): Promise<StoredRow[]> => {
      finds.push(args);

      return Promise.resolve(rows);
    },
    upsert: (args: UpsertArgs): Promise<void> => {
      upserts.push(args);

      return Promise.resolve();
    },
  };

  return { client: { mobilePublishedDay } as unknown as PrismaClient, finds, upserts };
};

const storedFrom = (days: DayPlan[]): StoredRow[] =>
  days.map((day) => ({
    scheduledDate: day.scheduledDate,
    contentHash: day.hash,
    legacyRowId: day.legacyRowId,
    isRestDay: day.isRestDay,
    dailyProgram: day.dailyProgram,
  }));

const patchRow = (rows: StoredRow[], isoDate: string, patch: Partial<StoredRow>): StoredRow[] =>
  rows.map((row) => (toIsoDate(row.scheduledDate) === isoDate ? { ...row, ...patch } : row));

const pickDay = (days: DayPlan[], isRestDay: boolean): DayPlan => {
  const day = days.find((candidate) => candidate.isRestDay === isRestDay);

  if (day === undefined) {
    throw new Error(`the window holds no ${isRestDay ? "rest" : "training"} day`);
  }

  return day;
};

const upsertFor = (upserts: UpsertArgs[], isoDate: string): UpsertArgs => {
  const call = upserts.find(
    (candidate) => toIsoDate(candidate.where.linkId_scheduledDate.scheduledDate) === isoDate,
  );

  if (call === undefined) {
    throw new Error(`no upsert was recorded for ${isoDate}`);
  }

  return call;
};

const reverseKeyOrder = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => reverseKeyOrder(item));
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).reverse();

    return Object.fromEntries(entries.map(([key, item]) => [key, reverseKeyOrder(item)]));
  }

  return value;
};

describe("upsertDays", () => {
  const days = windowFor(RUN_DATE);
  const training = pickDay(days, false);
  const rest = pickDay(days, true);

  it("creates the whole window against an empty table, scoped to the link", async () => {
    const db = fakeDb([]);

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: WINDOW_SIZE, updated: 0, unchanged: 0 });
    expect(db.upserts).toHaveLength(WINDOW_SIZE);
    expect(db.finds).toHaveLength(1);
    expect(db.finds.at(0)?.where.linkId).toBe(LINK_ID);
    expect(db.finds.at(0)?.where.scheduledDate.in).toHaveLength(WINDOW_SIZE);

    const call = upsertFor(db.upserts, training.isoDate);

    expect(call.where.linkId_scheduledDate).toEqual({
      linkId: LINK_ID,
      scheduledDate: training.scheduledDate,
    });
    expect(call.create).toMatchObject({
      linkId: LINK_ID,
      scheduledDate: training.scheduledDate,
      legacyRowId: training.legacyRowId,
      contentHash: training.hash,
      isRestDay: false,
    });
    expect(call.create.dailyProgram).toEqual(training.dailyProgram);
  });

  it("writes nothing when every stored row already matches the plan", async () => {
    const db = fakeDb(storedFrom(days));

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: 0, updated: 0, unchanged: WINDOW_SIZE });
    expect(db.upserts).toHaveLength(0);
  });

  it("repairs a training row whose stored program drifted under a matching hash", async () => {
    const db = fakeDb(
      patchRow(storedFrom(days), training.isoDate, { dailyProgram: { dayTrainings: [] } }),
    );

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: 0, updated: 1, unchanged: WINDOW_SIZE - 1 });
    expect(db.upserts).toHaveLength(1);

    const call = upsertFor(db.upserts, training.isoDate);

    expect(call.update.dailyProgram).toEqual(training.dailyProgram);
    expect(call.update.contentHash).toBe(training.hash);
    expect(call.update.isRestDay).toBe(false);
    expect(call.update.publishedAt).toBeInstanceOf(Date);
  });

  it("repairs a row written before isRestDay carried a value", async () => {
    const db = fakeDb(patchRow(storedFrom(days), rest.isoDate, { isRestDay: null }));

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: 0, updated: 1, unchanged: WINDOW_SIZE - 1 });
    expect(db.upserts).toHaveLength(1);
    expect(upsertFor(db.upserts, rest.isoDate).update.isRestDay).toBe(true);
  });

  it("repairs a row whose legacyRowId drifted off the calendar-derived value", async () => {
    const db = fakeDb(
      patchRow(storedFrom(days), training.isoDate, { legacyRowId: training.legacyRowId + 1 }),
    );

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: 0, updated: 1, unchanged: WINDOW_SIZE - 1 });
    expect(db.upserts).toHaveLength(1);
    expect(upsertFor(db.upserts, training.isoDate).update.legacyRowId).toBe(training.legacyRowId);
  });

  it("holds a stored program current when only its key order differs", async () => {
    const reordered = reverseKeyOrder(training.dailyProgram);

    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(training.dailyProgram));

    const db = fakeDb(patchRow(storedFrom(days), training.isoDate, { dailyProgram: reordered }));

    const counts = await upsertDays(db.client, LINK_ID, days);

    expect(counts).toEqual({ created: 0, updated: 0, unchanged: WINDOW_SIZE });
    expect(db.upserts).toHaveLength(0);
  });

  it("gives a rest day a SQL NULL program on create and on update alike", async () => {
    const created = fakeDb([]);

    await upsertDays(created.client, LINK_ID, days);

    const createCall = upsertFor(created.upserts, rest.isoDate);

    expect(createCall.create.isRestDay).toBe(true);
    expect(createCall.create.dailyProgram).toBe(Prisma.DbNull);
    expect(createCall.create.dailyProgram).not.toBe(Prisma.JsonNull);
    expect(createCall.create.dailyProgram).not.toBeNull();

    const updated = fakeDb(
      patchRow(storedFrom(days), rest.isoDate, { legacyRowId: rest.legacyRowId + 1 }),
    );

    await upsertDays(updated.client, LINK_ID, days);

    const updateCall = upsertFor(updated.upserts, rest.isoDate);

    expect(updateCall.update.isRestDay).toBe(true);
    expect(updateCall.update.dailyProgram).toBe(Prisma.DbNull);
    expect(updateCall.update.dailyProgram).not.toBe(Prisma.JsonNull);
    expect(updateCall.update.dailyProgram).not.toBeNull();
  });
});
