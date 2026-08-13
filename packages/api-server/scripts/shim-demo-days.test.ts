import { describe, expect, it } from "vitest";

import { legacyDailyProgramSchema } from "../src/endpoints/mobile-compat/wire-schemas";

import { planWindow, toIsoDate, utcMidnight } from "./shim-demo-days";

const WINDOW_SIZE = 64;
const REST_CYCLE = 4;

const windowFor = (isoDate: string) => planWindow(utcMidnight(isoDate));

describe("planWindow", () => {
  it("spans the run date minus three through plus sixty", () => {
    const days = windowFor("2026-08-13");

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
    const days = windowFor("2026-08-13");
    const restCount = days.filter((day) => day.isRestDay).length;

    expect(restCount).toBe(WINDOW_SIZE / REST_CYCLE);
    expect(days.filter((day) => day.isRestDay).map((day) => day.isoDate)).toContain("2026-08-16");
  });

  it("keeps a calendar date identical no matter which run date produced it", () => {
    const early = windowFor("2026-08-13");
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
    for (const day of windowFor("2026-08-13")) {
      if (day.isRestDay) {
        expect(day.dailyProgram).toBeNull();
        continue;
      }

      expect(legacyDailyProgramSchema.safeParse(day.dailyProgram).success).toBe(true);
      expect(day.dailyProgram?.dayTrainings.length).toBeGreaterThan(0);
    }
  });

  it("stamps each training day's own date as the first exercise line", () => {
    for (const day of windowFor("2026-08-13")) {
      if (day.isRestDay) {
        continue;
      }

      expect(day.dailyProgram?.dayTrainings.at(0)?.blocks.at(0)?.exercises.at(0)).toBe(
        `Session date: ${day.isoDate}`,
      );
    }
  });

  it("pins scheduledDate to UTC midnight so the @db.Date column round-trips", () => {
    for (const day of windowFor("2026-08-13")) {
      expect(day.scheduledDate.toISOString()).toBe(`${day.isoDate}T00:00:00.000Z`);
      expect(toIsoDate(day.scheduledDate)).toBe(day.isoDate);
    }
  });

  it("distinguishes training days from one another but collapses rest days", () => {
    const days = windowFor("2026-08-13");
    const trainingHashes = new Set(days.filter((d) => !d.isRestDay).map((d) => d.hash));
    const restHashes = new Set(days.filter((d) => d.isRestDay).map((d) => d.hash));

    expect(trainingHashes.size).toBe(days.filter((d) => !d.isRestDay).length);
    expect(restHashes.size).toBe(1);
  });
});
