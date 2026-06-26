import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type Composition,
  formatBenchmarkSummary,
  formatRepetitionLabel,
  formatRestSpec,
} from "@repo/contracts/lms/composition";
import { type Exercise } from "@repo/contracts/lms/exercise";
import {
  type ExerciseById,
  buildEffectiveIntensityTexts,
  buildRowSummaryTexts,
  resolveIntensity,
} from "@repo/contracts/lms/row-text";

import { mapToBlockWithSchemas } from "../../../../mappers/lms";

import { buildSchemaEntry } from "./format-legacy-schema";

const NOW = new Date("2026-06-26T00:00:00Z");
const BLOCK_ID = "clzparityblock0000000000";
const SCHEMA_ID = "clzparityschema000000000";

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

type PrismaBlock = Parameters<typeof mapToBlockWithSchemas>[0];
type PrismaSchema = PrismaBlock["schemas"][number];
type PrismaRow = PrismaSchema["rows"][number];

const makeRow = (over: {
  exerciseId: string;
  order: number;
  reps?: Prisma.JsonValue;
  load?: Prisma.JsonValue;
  intensity?: Prisma.JsonValue;
}): PrismaRow => ({
  id: cuid(`row${over.order}`),
  schemaId: SCHEMA_ID,
  order: over.order,
  exerciseId: over.exerciseId,
  sets: null,
  rowGroupId: null,
  load: over.load ?? null,
  reps: over.reps ?? null,
  side: null,
  tempo: null,
  media: null,
  intensity: over.intensity ?? null,
  rest: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  modifierAssignments: [],
});

const makeBlock = (over: {
  intensity?: Prisma.JsonValue;
  schemaHeader?: string | null;
  schemaComposition?: Prisma.JsonValue;
  schemaIntensity?: Prisma.JsonValue;
  rows: PrismaRow[];
}): PrismaBlock => ({
  id: BLOCK_ID,
  sessionId: cuid("sess"),
  order: 1,
  intensity: over.intensity ?? null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  labelAssignments: [],
  schemas: [
    {
      id: SCHEMA_ID,
      blockId: BLOCK_ID,
      groupId: null,
      order: 1,
      header: over.schemaHeader ?? null,
      composition: over.schemaComposition ?? null,
      intensity: over.schemaIntensity ?? null,
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
      rows: over.rows,
      rowGroups: [],
    },
  ],
  groups: [],
});

const profileLoad = (cells: { rx: string; m: number; f: number }[]): Prisma.JsonValue => ({
  kind: "byProfile",
  axes: [
    { axisId: cuid("axlevel"), label: "level", values: cells.map((c) => c.rx), binding: null },
    { axisId: cuid("axgender"), label: "Gender", values: ["M", "F"], binding: "GENDER" },
  ],
  cells: cells.flatMap((c) => [
    { coords: [c.rx, "M"], kg: c.m },
    { coords: [c.rx, "F"], kg: c.f },
  ]),
});

const EX = {
  squat: cuid("exsquat"),
  deadlift: cuid("exdead"),
  press: cuid("express"),
  pullup: cuid("expull"),
  run: cuid("exrun"),
};

const exerciseById: ExerciseById = new Map<string, Exercise>(
  (
    [
      [EX.squat, "back squat"],
      [EX.deadlift, "deadlift"],
      [EX.press, "press"],
      [EX.pullup, "pull up"],
      [EX.run, "run"],
    ] as [string, string][]
  ).map(([id, name]) => [
    id,
    {
      id,
      canonicalName: name,
      canonicalNameLower: name.toLowerCase(),
      nature: "CONCRETE",
      defaultDemoUrls: [],
      aliases: [],
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ]),
);

const COMPOSITION: Composition = {
  repetition: { kind: "count", count: 4 },
  rest: { scope: "between_rounds", duration: { unit: "sec", value: 90 } },
  benchmark: { resultType: "rounds_reps" },
};

const SCHEMA_INTENSITY = { effortPercent: { range: { min: 70, max: 80 } } };

const renderFixture = (): {
  block: ReturnType<typeof mapToBlockWithSchemas>;
  entry: string;
  lines: string[];
} => {
  const prismaBlock = makeBlock({
    schemaComposition: COMPOSITION as Prisma.JsonValue,
    schemaIntensity: SCHEMA_INTENSITY,
    rows: [
      makeRow({
        exerciseId: EX.squat,
        order: 1,
        reps: { kind: "count", value: 3 },
        load: { kind: "percentage", value: 80, reference: { scope: "self" } },
      }),
      makeRow({
        exerciseId: EX.deadlift,
        order: 2,
        load: { kind: "absolute", count: 2, kg: 24 },
      }),
      makeRow({
        exerciseId: EX.press,
        order: 3,
        load: profileLoad([{ rx: "RX", m: 60, f: 40 }]),
      }),
      makeRow({ exerciseId: EX.pullup, order: 4, load: { kind: "bodyweight" } }),
      makeRow({ exerciseId: EX.run, order: 5, intensity: { pace: "hard" } }),
    ],
  });
  const block = mapToBlockWithSchemas(prismaBlock);
  const schema = block.schemas[0];

  if (schema === undefined) {
    throw new Error("expected a schema");
  }

  const entry = buildSchemaEntry(schema, block, exerciseById);

  return { block, entry, lines: entry.split("\n") };
};

describe("mobile-publish projection — element-formatter parity (D-13 SSOT)", () => {
  it("renders every row's load through the shared formatLoad (no re-implementation), bracketed", () => {
    const { block, lines } = renderFixture();
    const schema = block.schemas[0];
    const movementLines = lines.slice(2);

    schema?.rows.forEach((row, index) => {
      const summary = buildRowSummaryTexts(row, exerciseById, {
        blockIntensity: block.intensity,
        schemaIntensity: schema.schema.intensity,
      });
      const line = movementLines[index] ?? "";

      if (summary.load !== null) {
        expect(line).toContain(`[ ${summary.load} ]`);
      }

      if (summary.volume !== null) {
        expect(line.startsWith(summary.volume)).toBe(true);
      }
    });
  });

  it("surfaces the schema composition in the header — repetition AND benchmark (no longer dropped)", () => {
    const { lines } = renderFixture();
    const headerLine = lines[0] ?? "";

    expect(headerLine).toContain(formatRepetitionLabel(COMPOSITION) ?? "");
    expect(headerLine).toContain(formatBenchmarkSummary(COMPOSITION) ?? "");
    expect(headerLine.endsWith(":")).toBe(true);
  });

  it("appends the composition rest through the shared formatRestSpec as the final line", () => {
    const { lines } = renderFixture();
    const restSpec = COMPOSITION.rest;

    expect(restSpec).toBeDefined();

    if (restSpec !== undefined) {
      expect(lines.at(-1)).toBe(formatRestSpec(restSpec));
    }
  });

  it("shows the shared schema intensity once in the header and never on a movement line", () => {
    const { block, lines } = renderFixture();
    const schema = block.schemas[0];
    const resolved = resolveIntensity(block.intensity, schema?.schema.intensity ?? null, null);
    const [intensityText] = buildEffectiveIntensityTexts(resolved, "schema");

    expect(intensityText).toBeDefined();

    const headerOccurrences = lines.filter((line) => line.includes(intensityText?.text ?? "##"));

    expect(lines[0]).toContain(intensityText?.text ?? "##");
    expect(headerOccurrences).toHaveLength(1);
  });

  it("keeps a row's OWN intensity on its movement line (provenance row, not inherited)", () => {
    const { lines } = renderFixture();

    expect(lines.at(-2)).toBe("run PACE · HARD");
  });

  it("emits one exercises[] entry per schema as header + blank line + movement lines", () => {
    const { entry, lines } = renderFixture();

    expect(entry).toContain("\n\n");
    expect(lines[1]).toBe("");
    expect(lines.slice(2).filter((line) => line !== "")).toHaveLength(6);
  });
});
