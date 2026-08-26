import { describe, expect, it } from "vitest";

import {
  type BackfillReader,
  CONTENTLESS_WHERE,
  FILLED_WHERE,
  type LedgerRow,
  loadBackfillSnapshot,
  toBackfillTarget,
} from "./legacy-days-backfill-snapshot";

const ledgerRow = (overrides: Partial<LedgerRow> = {}): LedgerRow => ({
  id: "day_1",
  scheduledDate: new Date("2026-07-01T00:00:00.000Z"),
  legacyRowId: 11,
  link: {
    channel: "GENERAL",
    legacyLevelId: 2,
    legacyUserId: null,
    plan: { name: "Winter Cycle" },
  },
  ...overrides,
});

const readerFor = (rows: LedgerRow[], filled: number, seen: unknown[]): BackfillReader => ({
  mobilePublishedDay: {
    findMany: (args) => {
      seen.push(args);

      return Promise.resolve(rows);
    },
    count: (args) => {
      seen.push(args);

      return Promise.resolve(filled);
    },
  },
});

describe("toBackfillTarget", () => {
  it("reads a general link's target from its training level", () => {
    expect(toBackfillTarget(ledgerRow())).toEqual({
      dayId: "day_1",
      planName: "Winter Cycle",
      channel: "GENERAL",
      legacyTargetId: 2,
      scheduledDate: "2026-07-01",
      legacyRowId: 11,
    });
  });

  it("reads an individual link's target from its athlete", () => {
    const target = toBackfillTarget(
      ledgerRow({
        link: {
          channel: "INDIVIDUAL",
          legacyLevelId: 4,
          legacyUserId: 7,
          plan: { name: "Solo Block" },
        },
      }),
    );

    expect(target.channel).toBe("INDIVIDUAL");
    expect(target.legacyTargetId).toBe(7);
  });

  it("carries a missing channel id through as null rather than inventing one", () => {
    const target = toBackfillTarget(
      ledgerRow({
        link: { channel: "GENERAL", legacyLevelId: null, legacyUserId: 7, plan: { name: "P" } },
      }),
    );

    expect(target.legacyTargetId).toBeNull();
  });

  it("renders the stored date in UTC, the way the wire and the export both read it", () => {
    const target = toBackfillTarget(
      ledgerRow({ scheduledDate: new Date("2026-01-31T00:00:00.000Z") }),
    );

    expect(target.scheduledDate).toBe("2026-01-31");
  });
});

describe("loadBackfillSnapshot", () => {
  it("asks only for rows that carry no content, and counts the ones that do", async () => {
    const seen: unknown[] = [];
    const snapshot = await loadBackfillSnapshot(readerFor([ledgerRow()], 120, seen));

    expect(seen).toEqual([CONTENTLESS_WHERE, FILLED_WHERE]);
    expect(snapshot.targets).toHaveLength(1);
    expect(snapshot.alreadyFilled).toBe(120);
  });

  it("asks for content-less rows by the same null the shim's read filters on", () => {
    expect(CONTENTLESS_WHERE).toEqual({ where: { isRestDay: null } });
    expect(FILLED_WHERE).toEqual({ where: { isRestDay: { not: null } } });
  });
});
