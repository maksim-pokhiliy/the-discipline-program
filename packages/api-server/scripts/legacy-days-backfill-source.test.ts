import { describe, expect, it } from "vitest";

import { legacyDaysSourceSchema, parseLegacyDays } from "./legacy-days-backfill-source";

const PROGRAM = {
  dayTrainings: [
    { trainingNumber: 1, blocks: [{ name: "WARM-UP", exercises: ["3 rounds of nothing"] }] },
  ],
};

const generalRow = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  scheduled_date: "2026-07-01",
  training_level_id: 2,
  is_rest_day: false,
  daily_program: PROGRAM,
  ...overrides,
});

const individualRow = (overrides: Record<string, unknown> = {}) => ({
  id: 91,
  scheduled_date: "2026-07-01",
  user_id: 7,
  is_rest_day: true,
  daily_program: null,
  ...overrides,
});

const fileOf = (overrides: Record<string, unknown> = {}) => ({
  general: [generalRow()],
  individual: [individualRow()],
  ...overrides,
});

const reasonsOf = (raw: unknown): string[] =>
  parseLegacyDays(raw).defects.map((defect) => defect.reason);

describe("parseLegacyDays", () => {
  it("normalizes both tables into one list keyed by the id each channel matches on", () => {
    const parsed = parseLegacyDays(fileOf());

    expect(parsed.defects).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        table: "general",
        legacyRowId: 11,
        legacyTargetId: 2,
        scheduledDate: "2026-07-01",
        isRestDay: false,
        dailyProgram: PROGRAM,
      },
      {
        table: "individual",
        legacyRowId: 91,
        legacyTargetId: 7,
        scheduledDate: "2026-07-01",
        isRestDay: true,
        dailyProgram: null,
      },
    ]);
  });

  it("refuses an export carrying a column the legacy table does not have", () => {
    expect(() =>
      parseLegacyDays(fileOf({ general: [generalRow({ notes: "hand edited" })] })),
    ).toThrow();
  });

  it("refuses an export missing a column the match depends on", () => {
    const withoutLevel: Record<string, unknown> = { ...generalRow() };

    delete withoutLevel.training_level_id;

    expect(() => parseLegacyDays(fileOf({ general: [withoutLevel] }))).toThrow();
  });

  it("refuses a scheduled date that is not a calendar date", () => {
    expect(() =>
      parseLegacyDays(fileOf({ general: [generalRow({ scheduled_date: "2026-13-40" })] })),
    ).toThrow();
  });

  it("refuses an export holding no rows at all", () => {
    expect(() => parseLegacyDays({ general: [], individual: [] })).toThrow();
  });

  it("takes an export where only one of the two tables has rows", () => {
    expect(parseLegacyDays({ general: [generalRow()], individual: [] }).rows).toHaveLength(1);
  });

  it("calls a rest day carrying a program a defect", () => {
    expect(reasonsOf(fileOf({ general: [generalRow({ is_rest_day: true })] }))).toContain(
      "rest-day-carries-a-program",
    );
  });

  it("calls a training day carrying no program a defect", () => {
    expect(reasonsOf(fileOf({ general: [generalRow({ daily_program: null })] }))).toContain(
      "training-day-carries-no-program",
    );
  });

  it("calls a program the app could not be served a defect", () => {
    expect(
      reasonsOf(
        fileOf({ general: [generalRow({ daily_program: { dayTrainings: "not a list" } })] }),
      ),
    ).toContain("program-body-is-not-the-wire-shape");
  });

  it("calls a program carrying fields we would drop a defect rather than dropping them", () => {
    const withExtra = {
      dayTrainings: [
        {
          trainingNumber: 1,
          blocks: [{ name: "WARM-UP", exercises: ["x"], note: "kept in the legacy row" }],
        },
      ],
    };

    expect(reasonsOf(fileOf({ general: [generalRow({ daily_program: withExtra })] }))).toContain(
      "program-body-carries-fields-we-would-drop",
    );
  });

  it("calls a repeated row id inside one table a defect, on every copy", () => {
    const reasons = reasonsOf(
      fileOf({ general: [generalRow(), generalRow({ scheduled_date: "2026-07-02" })] }),
    );

    expect(reasons).toEqual(["duplicate-legacy-row-id", "duplicate-legacy-row-id"]);
  });

  it("lets the two tables reuse the same row id, since they are separate id spaces", () => {
    const parsed = parseLegacyDays(
      fileOf({ general: [generalRow({ id: 5 })], individual: [individualRow({ id: 5 })] }),
    );

    expect(parsed.defects).toEqual([]);
    expect(parsed.rows).toHaveLength(2);
  });

  it("keeps a defective row out of the normalized rows entirely", () => {
    const parsed = parseLegacyDays(fileOf({ general: [generalRow({ is_rest_day: true })] }));

    expect(parsed.rows.map((row) => row.table)).toEqual(["individual"]);
  });
});

describe("legacyDaysSourceSchema", () => {
  it("rejects a file whose top level is not the two named tables", () => {
    expect(legacyDaysSourceSchema.safeParse({ rows: [] }).success).toBe(false);
    expect(
      legacyDaysSourceSchema.safeParse({ general: [], individual: [], extra: [] }).success,
    ).toBe(false);
  });
});
