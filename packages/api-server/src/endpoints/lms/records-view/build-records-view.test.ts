import { OneRMRecordSource, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Load, type Result } from "@repo/contracts/lms/_shared";
import { type Composition } from "@repo/contracts/lms/composition";

import { buildRecordsView } from "./build-records-view";
import { type BenchmarkResultRecord, type OneRMRecordRecord } from "./records-view.types";

const at = (iso: string): Date => new Date(iso);

type OneRMRowOverrides = {
  exerciseId?: string;
  exerciseName?: string;
  valueKg?: number;
  recordedAt?: Date;
  source?: OneRMRecordSource;
};

const oneRMRow = (overrides: OneRMRowOverrides = {}): OneRMRecordRecord => ({
  id: `onerm-${overrides.recordedAt?.toISOString() ?? "x"}-${overrides.valueKg ?? 0}`,
  userId: "user-1",
  exerciseId: overrides.exerciseId ?? "exercise-back-squat",
  valueKg: new Prisma.Decimal(overrides.valueKg ?? 100),
  recordedAt: overrides.recordedAt ?? at("2026-01-01T00:00:00.000Z"),
  source: overrides.source ?? OneRMRecordSource.MANUAL,
  exercise: { canonicalName: overrides.exerciseName ?? "Back Squat" },
});

type BenchmarkSchemaOverrides = {
  header?: string | null;
  composition?: Composition | null;
  sessionLabel?: string;
  dayLabel?: string;
  rows?: { canonicalName: string; load?: Load | null }[];
};

const benchmarkSchema = (
  overrides: BenchmarkSchemaOverrides = {},
): BenchmarkResultRecord["plannedSchema"] => ({
  header: overrides.header ?? null,
  composition: overrides.composition ?? null,
  block: {
    session: {
      label: overrides.sessionLabel === undefined ? null : { name: overrides.sessionLabel },
      day: { label: overrides.dayLabel === undefined ? null : { name: overrides.dayLabel } },
    },
  },
  rows: (overrides.rows ?? []).map((row) => ({
    load: row.load ?? null,
    reps: null,
    exercise: { canonicalName: row.canonicalName },
  })),
});

type BenchmarkRowOverrides = {
  plannedSchemaId?: string;
  result: Result;
  recordedAt?: Date;
  schema?: BenchmarkSchemaOverrides;
};

const benchmarkRow = (overrides: BenchmarkRowOverrides): BenchmarkResultRecord => ({
  id: `bench-${overrides.recordedAt?.toISOString() ?? "x"}`,
  userId: "user-1",
  plannedSchemaId: overrides.plannedSchemaId ?? "schema-fran",
  result: overrides.result,
  recordedAt: overrides.recordedAt ?? at("2026-01-01T00:00:00.000Z"),
  createdAt: overrides.recordedAt ?? at("2026-01-01T00:00:00.000Z"),
  plannedSchema: benchmarkSchema(overrides.schema),
});

const absoluteLoad = (kg: number): Load => ({ kind: "absolute", count: 1, kg });

const ladder = (steps: number[]): Composition => ({ repetition: { kind: "ladder", steps } });

describe("buildRecordsView", () => {
  describe("empty inputs", () => {
    it("returns empty sections when no rows are given", () => {
      expect(buildRecordsView({ oneRMRows: [], benchmarkRows: [] })).toEqual({
        oneRM: [],
        benchmarks: [],
      });
    });
  });

  describe("1RM section", () => {
    it("keeps the best as the all-time max, not the latest (de-load)", () => {
      const rows = [
        oneRMRow({ valueKg: 100, recordedAt: at("2026-01-01T00:00:00.000Z") }),
        oneRMRow({ valueKg: 120, recordedAt: at("2026-02-01T00:00:00.000Z") }),
        oneRMRow({ valueKg: 110, recordedAt: at("2026-03-01T00:00:00.000Z") }),
      ];

      const [record] = buildRecordsView({ oneRMRows: rows, benchmarkRows: [] }).oneRM;

      expect(record?.best).toBe(120);
      expect(record?.bestRecordedAt).toBe(at("2026-02-01T00:00:00.000Z").toISOString());
      expect(record?.delta).toBe(110 - 120);
      expect(record?.lastRecordedAt).toBe(at("2026-03-01T00:00:00.000Z").toISOString());
      expect(record?.recordCount).toBe(3);
    });

    it("uses the first row achieving the max for bestRecordedAt and bestSource", () => {
      const rows = [
        oneRMRow({
          valueKg: 120,
          recordedAt: at("2026-01-01T00:00:00.000Z"),
          source: OneRMRecordSource.TESTED,
        }),
        oneRMRow({
          valueKg: 120,
          recordedAt: at("2026-04-01T00:00:00.000Z"),
          source: OneRMRecordSource.MANUAL,
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: rows, benchmarkRows: [] }).oneRM;

      expect(record?.best).toBe(120);
      expect(record?.bestRecordedAt).toBe(at("2026-01-01T00:00:00.000Z").toISOString());
      expect(record?.bestSource).toBe(OneRMRecordSource.TESTED);
    });

    it("returns a zero delta for a single record", () => {
      const rows = [oneRMRow({ valueKg: 90, recordedAt: at("2026-01-01T00:00:00.000Z") })];

      const [record] = buildRecordsView({ oneRMRows: rows, benchmarkRows: [] }).oneRM;

      expect(record?.delta).toBe(0);
      expect(record?.recordCount).toBe(1);
    });

    it("emits an ascending ISO series", () => {
      const rows = [
        oneRMRow({ valueKg: 110, recordedAt: at("2026-03-01T00:00:00.000Z") }),
        oneRMRow({ valueKg: 100, recordedAt: at("2026-01-01T00:00:00.000Z") }),
        oneRMRow({ valueKg: 105, recordedAt: at("2026-02-01T00:00:00.000Z") }),
      ];

      const [record] = buildRecordsView({ oneRMRows: rows, benchmarkRows: [] }).oneRM;

      expect(record?.series).toEqual([
        { valueKg: 100, recordedAt: at("2026-01-01T00:00:00.000Z").toISOString() },
        { valueKg: 105, recordedAt: at("2026-02-01T00:00:00.000Z").toISOString() },
        { valueKg: 110, recordedAt: at("2026-03-01T00:00:00.000Z").toISOString() },
      ]);
    });

    it("groups two exercises into two records ordered by name", () => {
      const rows = [
        oneRMRow({
          exerciseId: "exercise-snatch",
          exerciseName: "Snatch",
          valueKg: 70,
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
        oneRMRow({
          exerciseId: "exercise-deadlift",
          exerciseName: "Deadlift",
          valueKg: 200,
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
      ];

      const { oneRM } = buildRecordsView({ oneRMRows: rows, benchmarkRows: [] });

      expect(oneRM.map((record) => record.exerciseName)).toEqual(["Deadlift", "Snatch"]);
      expect(oneRM.map((record) => record.exerciseId)).toEqual([
        "exercise-deadlift",
        "exercise-snatch",
      ]);
    });
  });

  describe("benchmark section — all six result formats", () => {
    const cases: {
      type: string;
      rows: BenchmarkRowOverrides[];
      best: Result;
      deltaValue: number;
    }[] = [
      {
        type: "time",
        rows: [
          { result: { type: "time", seconds: 180 }, recordedAt: at("2026-01-01T00:00:00.000Z") },
          { result: { type: "time", seconds: 150 }, recordedAt: at("2026-02-01T00:00:00.000Z") },
        ],
        best: { type: "time", seconds: 150 },
        deltaValue: 150 - 180,
      },
      {
        type: "load",
        rows: [
          { result: { type: "load", kg: 100 }, recordedAt: at("2026-01-01T00:00:00.000Z") },
          { result: { type: "load", kg: 120 }, recordedAt: at("2026-02-01T00:00:00.000Z") },
        ],
        best: { type: "load", kg: 120 },
        deltaValue: 120 - 100,
      },
      {
        type: "max_reps",
        rows: [
          { result: { type: "max_reps", reps: 30 }, recordedAt: at("2026-01-01T00:00:00.000Z") },
          { result: { type: "max_reps", reps: 42 }, recordedAt: at("2026-02-01T00:00:00.000Z") },
        ],
        best: { type: "max_reps", reps: 42 },
        deltaValue: 42 - 30,
      },
      {
        type: "distance",
        rows: [
          {
            result: { type: "distance", value: 4, unit: "km" },
            recordedAt: at("2026-01-01T00:00:00.000Z"),
          },
          {
            result: { type: "distance", value: 5, unit: "km" },
            recordedAt: at("2026-02-01T00:00:00.000Z"),
          },
        ],
        best: { type: "distance", value: 5, unit: "km" },
        deltaValue: 5 - 4,
      },
      {
        type: "calories",
        rows: [
          { result: { type: "calories", value: 50 }, recordedAt: at("2026-01-01T00:00:00.000Z") },
          { result: { type: "calories", value: 60 }, recordedAt: at("2026-02-01T00:00:00.000Z") },
        ],
        best: { type: "calories", value: 60 },
        deltaValue: 60 - 50,
      },
      {
        type: "rounds_reps",
        rows: [
          {
            result: { type: "rounds_reps", rounds: 5, reps: 3 },
            recordedAt: at("2026-01-01T00:00:00.000Z"),
          },
          {
            result: { type: "rounds_reps", rounds: 6, reps: 1 },
            recordedAt: at("2026-02-01T00:00:00.000Z"),
          },
        ],
        best: { type: "rounds_reps", rounds: 6, reps: 1 },
        deltaValue: 6 - 5,
      },
    ];

    cases.forEach(({ type, rows, best, deltaValue }) => {
      it(`derives best and improving delta for ${type}`, () => {
        const benchmarkRows = rows.map((row) => benchmarkRow(row));

        const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

        expect(record?.best).toEqual(best);
        expect(record?.resultType).toBe(best.type);
        expect(record?.delta).toEqual({ value: deltaValue, improved: true });
        expect(record?.attemptCount).toBe(2);
      });
    });
  });

  describe("benchmark section — direction-aware best", () => {
    it("keeps the fastest time as best and reports a non-improving slower latest", () => {
      const benchmarkRows = [
        benchmarkRow({
          result: { type: "time", seconds: 150 },
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "time", seconds: 170 },
          recordedAt: at("2026-02-01T00:00:00.000Z"),
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

      expect(record?.best).toEqual({ type: "time", seconds: 150 });
      expect(record?.bestRecordedAt).toBe(at("2026-01-01T00:00:00.000Z").toISOString());
      expect(record?.delta).toEqual({ value: 170 - 150, improved: false });
    });

    it("keeps the heaviest load as best", () => {
      const benchmarkRows = [
        benchmarkRow({
          result: { type: "load", kg: 140 },
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "load", kg: 120 },
          recordedAt: at("2026-02-01T00:00:00.000Z"),
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

      expect(record?.best).toEqual({ type: "load", kg: 140 });
      expect(record?.delta).toEqual({ value: 120 - 140, improved: false });
    });

    it("breaks rounds_reps ties by reps after rounds", () => {
      const benchmarkRows = [
        benchmarkRow({
          result: { type: "rounds_reps", rounds: 5, reps: 3 },
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "rounds_reps", rounds: 5, reps: 10 },
          recordedAt: at("2026-02-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "rounds_reps", rounds: 4, reps: 20 },
          recordedAt: at("2026-03-01T00:00:00.000Z"),
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

      expect(record?.best).toEqual({ type: "rounds_reps", rounds: 5, reps: 10 });
      expect(record?.delta).toEqual({ value: 4 - 5, improved: false });
    });

    it("returns a null delta for a single attempt", () => {
      const benchmarkRows = [
        benchmarkRow({
          result: { type: "time", seconds: 150 },
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

      expect(record?.delta).toBeNull();
      expect(record?.attemptCount).toBe(1);
    });

    it("computes delta from the two most-recent attempts, not max minus previous max", () => {
      const benchmarkRows = [
        benchmarkRow({
          result: { type: "load", kg: 100 },
          recordedAt: at("2026-01-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "load", kg: 140 },
          recordedAt: at("2026-02-01T00:00:00.000Z"),
        }),
        benchmarkRow({
          result: { type: "load", kg: 130 },
          recordedAt: at("2026-03-01T00:00:00.000Z"),
        }),
      ];

      const [record] = buildRecordsView({ oneRMRows: [], benchmarkRows }).benchmarks;

      expect(record?.best).toEqual({ type: "load", kg: 140 });
      expect(record?.delta).toEqual({ value: 130 - 140, improved: false });
    });
  });

  describe("benchmark title resolution", () => {
    const result: Result = { type: "time", seconds: 120 };

    it("prefers the schema header", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({
            result,
            schema: { header: "Fran", sessionLabel: "Metcon", dayLabel: "Friday" },
          }),
        ],
      }).benchmarks;

      expect(record?.title).toBe("Fran");
    });

    it("falls back to the session label when no header", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({ result, schema: { sessionLabel: "Metcon", dayLabel: "Friday" } }),
        ],
      }).benchmarks;

      expect(record?.title).toBe("Metcon");
    });

    it("falls back to the day label when no header or session label", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [benchmarkRow({ result, schema: { dayLabel: "Friday" } })],
      }).benchmarks;

      expect(record?.title).toBe("Friday");
    });

    it("falls back to the first row movement when no labels", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({ result, schema: { rows: [{ canonicalName: "Thruster" }] } }),
        ],
      }).benchmarks;

      expect(record?.title).toBe("Thruster");
    });

    it("falls back to the plannedSchemaId when nothing else is present", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [benchmarkRow({ result, plannedSchemaId: "schema-xyz" })],
      }).benchmarks;

      expect(record?.title).toBe("schema-xyz");
    });
  });

  describe("benchmark subline reconstruction", () => {
    const result: Result = { type: "time", seconds: 120 };

    it("builds a faithful scheme plus movement list with absolute loads", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({
            result,
            schema: {
              header: "Fran",
              composition: ladder([21, 15, 9]),
              rows: [
                { canonicalName: "Thruster", load: absoluteLoad(43) },
                { canonicalName: "Pull-Up" },
              ],
            },
          }),
        ],
      }).benchmarks;

      expect(record?.subline).toContain("21-15-9");
      expect(record?.subline).toContain("Thruster 43kg");
      expect(record?.subline).toContain("Pull-Up");
    });

    it("omits load for non-absolute kinds in the movement list", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({
            result,
            schema: {
              composition: ladder([21, 15, 9]),
              rows: [
                {
                  canonicalName: "Thruster",
                  load: { kind: "percentage", value: 60, reference: { scope: "self" } },
                },
              ],
            },
          }),
        ],
      }).benchmarks;

      expect(record?.subline).toContain("Thruster");
      expect(record?.subline).not.toContain("kg");
    });

    it("falls back to a structural summary when there are no rows", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [
          benchmarkRow({
            result,
            schema: { composition: { cap: { min: 20, unit: "min" } } },
          }),
        ],
      }).benchmarks;

      expect(record?.subline).toContain("cap 20");
    });

    it("falls back to the result-type label when there is no header, composition, or rows", () => {
      const [record] = buildRecordsView({
        oneRMRows: [],
        benchmarkRows: [benchmarkRow({ result: { type: "time", seconds: 90 } })],
      }).benchmarks;

      expect(record?.subline).toBe("Time");
    });
  });

  describe("benchmark grouping", () => {
    it("groups by plannedSchemaId and orders output by title", () => {
      const benchmarkRows = [
        benchmarkRow({
          plannedSchemaId: "schema-grace",
          result: { type: "load", kg: 60 },
          schema: { header: "Grace" },
        }),
        benchmarkRow({
          plannedSchemaId: "schema-fran",
          result: { type: "time", seconds: 200 },
          schema: { header: "Fran" },
        }),
      ];

      const { benchmarks } = buildRecordsView({ oneRMRows: [], benchmarkRows });

      expect(benchmarks.map((record) => record.title)).toEqual(["Fran", "Grace"]);
      expect(benchmarks.map((record) => record.plannedSchemaId)).toEqual([
        "schema-fran",
        "schema-grace",
      ]);
    });
  });
});
