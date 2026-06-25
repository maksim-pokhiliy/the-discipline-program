import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Intensity, type Load } from "@repo/contracts/lms/_shared";
import { type Composition } from "@repo/contracts/lms/composition";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type ExerciseById, renderRowLine } from "@repo/contracts/lms/row-text";

import { mapToBlockWithSchemas } from "../../../../mappers/lms";
import { type MobilePublishDayPayload } from "../day-include";

import { projectDay } from "./project-day";

const NOW = new Date("2026-06-07T12:00:00Z");
const WEEK_START = new Date("2026-06-08T00:00:00Z");

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

type PrismaRow =
  MobilePublishDayPayload["sessions"][number]["blocks"][number]["schemas"][number]["rows"][number];
type PrismaSchema =
  MobilePublishDayPayload["sessions"][number]["blocks"][number]["schemas"][number];
type PrismaBlock = MobilePublishDayPayload["sessions"][number]["blocks"][number];
type PrismaSession = MobilePublishDayPayload["sessions"][number];
type PrismaExercise = PrismaRow["exercise"];
type PrismaModifierAssignment = PrismaRow["modifierAssignments"][number];

type RowSpec = {
  id: string;
  schemaId: string;
  order: number;
  exerciseId: string;
  canonicalName: string;
  sets?: number | null;
  reps?: Prisma.JsonValue;
  load?: Load | null;
  side?: Prisma.JsonValue;
  tempo?: Prisma.JsonValue;
  intensity?: Intensity | null;
  rest?: Prisma.JsonValue;
  modifierNames?: string[];
  notes?: string[] | null;
};

type SchemaSpec = {
  id: string;
  blockId: string;
  order: number;
  composition?: Composition | null;
  intensity?: Intensity | null;
  rows: RowSpec[];
};

type BlockSpec = {
  id: string;
  sessionId: string;
  order: number;
  labelName?: string;
  intensity?: Intensity | null;
  schemas: SchemaSpec[];
};

type SessionSpec = {
  id: string;
  order: number;
  blocks: BlockSpec[];
};

const makeExerciseRecord = (id: string, canonicalName: string): PrismaExercise => ({
  id,
  canonicalName,
  canonicalNameLower: canonicalName.toLowerCase(),
  nature: "CONCRETE",
  defaultDemoUrls: [],
  aliases: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeModifierAssignment = (
  blockId: string,
  name: string,
  order: number,
): PrismaModifierAssignment => {
  const modifierId = cuid(`${blockId}mod${order}`);

  return {
    id: cuid(`${blockId}modasg${order}`),
    rowId: cuid(`${blockId}row${order}`),
    modifierId,
    order,
    modifier: {
      id: modifierId,
      name,
      nameLower: name.toLowerCase(),
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
};

const makeRow = (spec: RowSpec): PrismaRow => ({
  id: spec.id,
  schemaId: spec.schemaId,
  order: spec.order,
  exerciseId: spec.exerciseId,
  sets: spec.sets ?? null,
  rowGroupId: null,
  load: (spec.load ?? null) as Prisma.JsonValue,
  reps: spec.reps ?? null,
  side: spec.side ?? null,
  tempo: spec.tempo ?? null,
  media: null,
  intensity: (spec.intensity ?? null) as Prisma.JsonValue,
  rest: spec.rest ?? null,
  notes: spec.notes ?? null,
  createdAt: NOW,
  updatedAt: NOW,
  modifierAssignments: (spec.modifierNames ?? []).map((name, index) =>
    makeModifierAssignment(spec.schemaId, name, index),
  ),
  exercise: makeExerciseRecord(spec.exerciseId, spec.canonicalName),
});

const makeSchema = (spec: SchemaSpec): PrismaSchema => ({
  id: spec.id,
  blockId: spec.blockId,
  groupId: null,
  order: spec.order,
  header: null,
  composition: (spec.composition ?? null) as Prisma.JsonValue,
  intensity: (spec.intensity ?? null) as Prisma.JsonValue,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows: spec.rows.map(makeRow),
  rowGroups: [],
});

const makeBlock = (spec: BlockSpec): PrismaBlock => ({
  id: spec.id,
  sessionId: spec.sessionId,
  order: spec.order,
  intensity: (spec.intensity ?? null) as Prisma.JsonValue,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  labelAssignments:
    spec.labelName === undefined
      ? []
      : [
          {
            id: cuid(`${spec.id}lblasg`),
            blockId: spec.id,
            labelId: cuid(`${spec.id}lbl`),
            order: 0,
            label: {
              id: cuid(`${spec.id}lbl`),
              name: spec.labelName,
              nameLower: spec.labelName.toLowerCase(),
              applicableLevels: ["BLOCK"],
              notes: null,
              rest: false,
              createdAt: NOW,
              updatedAt: NOW,
            },
          },
        ],
  schemas: spec.schemas.map(makeSchema),
  groups: [],
});

const makeSession = (spec: SessionSpec, dayId: string): PrismaSession => ({
  id: spec.id,
  dayId,
  order: spec.order,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  blocks: spec.blocks.map(makeBlock),
});

const makeWorkingDay = (sessions: SessionSpec[]): MobilePublishDayPayload => {
  const dayId = cuid("day");

  return {
    id: dayId,
    weekId: cuid("week"),
    dayOfWeek: "MONDAY",
    labelId: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    week: { startDate: WEEK_START },
    label: null,
    sessions: sessions.map((session) => makeSession(session, dayId)),
  };
};

const makeRestDay = (): MobilePublishDayPayload => {
  const dayId = cuid("restday");

  return {
    id: dayId,
    weekId: cuid("week"),
    dayOfWeek: "SUNDAY",
    labelId: cuid("restlbl"),
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    week: { startDate: WEEK_START },
    label: {
      id: cuid("restlbl"),
      name: "Rest",
      nameLower: "rest",
      applicableLevels: ["DAY"],
      notes: null,
      rest: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    sessions: [],
  };
};

const makeExerciseById = (entries: { id: string; canonicalName: string }[]): ExerciseById => {
  const map = new Map<string, Exercise>();

  for (const entry of entries) {
    map.set(entry.id, {
      id: entry.id,
      canonicalName: entry.canonicalName,
      canonicalNameLower: entry.canonicalName.toLowerCase(),
      nature: "CONCRETE",
      defaultDemoUrls: [],
      aliases: [],
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  return map;
};

const EX_SQUAT = cuid("exsquat");
const EX_DEADLIFT = cuid("exdead");
const EX_PRESS = cuid("express");
const EX_PULLUP = cuid("expull");
const EX_ROW = cuid("exrow");
const EX_RUN = cuid("exrun");
const EX_BIKE = cuid("exbike");
const EX_SKI = cuid("exski");
const EX_BURPEE = cuid("exburp");
const EX_LUNGE = cuid("exlunge");

const BLOCK_A_INTENSITY: Intensity = { effortPercent: { range: { min: 70, max: 80 } } };

const SESSION_ONE: SessionSpec = {
  id: cuid("s1"),
  order: 10,
  blocks: [
    {
      id: cuid("b1a"),
      sessionId: cuid("s1"),
      order: 10,
      labelName: "Strength",
      intensity: BLOCK_A_INTENSITY,
      schemas: [
        {
          id: cuid("sc1a"),
          blockId: cuid("b1a"),
          order: 10,
          rows: [
            {
              id: cuid("b1arow0"),
              schemaId: cuid("sc1a"),
              order: 10,
              exerciseId: EX_SQUAT,
              canonicalName: "back squat",
              sets: 5,
              reps: { kind: "count", value: 3 },
              load: { kind: "percentage", value: 80, reference: { scope: "self" } },
              side: { kind: "each_leg" },
              tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
              intensity: { rpe: { value: 8 } },
              rest: { duration: { value: 120, unit: "sec" }, scope: "between_sets" },
              modifierNames: ["from sofa"],
              notes: ["keep the chest up"],
            },
            {
              id: cuid("b1arow1"),
              schemaId: cuid("sc1a"),
              order: 20,
              exerciseId: EX_DEADLIFT,
              canonicalName: "deadlift",
              load: { kind: "absolute", count: 1, kg: 100 },
            },
            {
              id: cuid("b1arow2"),
              schemaId: cuid("sc1a"),
              order: 30,
              exerciseId: EX_PRESS,
              canonicalName: "press",
              load: {
                kind: "byProfile",
                axes: [
                  {
                    axisId: cuid("axisgender"),
                    label: "Gender",
                    values: ["Male", "Female"],
                    binding: "GENDER",
                  },
                ],
                cells: [
                  { coords: ["Male"], kg: 60 },
                  { coords: ["Female"], kg: 40 },
                ],
              },
            },
            {
              id: cuid("b1arow3"),
              schemaId: cuid("sc1a"),
              order: 40,
              exerciseId: EX_PULLUP,
              canonicalName: "pull up",
              load: { kind: "bodyweight" },
            },
          ],
        },
      ],
    },
    {
      id: cuid("b1b"),
      sessionId: cuid("s1"),
      order: 20,
      labelName: "Conditioning",
      schemas: [
        {
          id: cuid("sc1b"),
          blockId: cuid("b1b"),
          order: 10,
          composition: { benchmark: { resultType: "rounds_reps" } },
          rows: [
            {
              id: cuid("b1brow0"),
              schemaId: cuid("sc1b"),
              order: 10,
              exerciseId: EX_RUN,
              canonicalName: "run",
              intensity: { pace: "hard" },
            },
            {
              id: cuid("b1brow1"),
              schemaId: cuid("sc1b"),
              order: 20,
              exerciseId: EX_BIKE,
              canonicalName: "bike",
              intensity: { hrZone: { zone: "Z3" } },
            },
            {
              id: cuid("b1brow2"),
              schemaId: cuid("sc1b"),
              order: 30,
              exerciseId: EX_SKI,
              canonicalName: "ski erg",
              intensity: {
                numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
              },
            },
            {
              id: cuid("b1brow3"),
              schemaId: cuid("sc1b"),
              order: 40,
              exerciseId: EX_BURPEE,
              canonicalName: "burpee",
              reps: { kind: "range", min: 8, max: 12 },
            },
          ],
        },
      ],
    },
    {
      id: cuid("b1c"),
      sessionId: cuid("s1"),
      order: 30,
      labelName: "Cooldown",
      schemas: [],
    },
  ],
};

const SESSION_TWO: SessionSpec = {
  id: cuid("s2"),
  order: 20,
  blocks: [
    {
      id: cuid("b2a"),
      sessionId: cuid("s2"),
      order: 10,
      schemas: [
        {
          id: cuid("sc2a"),
          blockId: cuid("b2a"),
          order: 10,
          rows: [
            {
              id: cuid("b2arow0"),
              schemaId: cuid("sc2a"),
              order: 10,
              exerciseId: EX_ROW,
              canonicalName: "row",
              load: { kind: "absolute", count: 2, kg: 24 },
            },
            {
              id: cuid("b2arow1"),
              schemaId: cuid("sc2a"),
              order: 20,
              exerciseId: EX_LUNGE,
              canonicalName: "walking lunge",
              side: { kind: "alternating" },
            },
          ],
        },
      ],
    },
  ],
};

const EXERCISES = makeExerciseById([
  { id: EX_SQUAT, canonicalName: "back squat" },
  { id: EX_DEADLIFT, canonicalName: "deadlift" },
  { id: EX_PRESS, canonicalName: "press" },
  { id: EX_PULLUP, canonicalName: "pull up" },
  { id: EX_ROW, canonicalName: "row" },
  { id: EX_RUN, canonicalName: "run" },
  { id: EX_BIKE, canonicalName: "bike" },
  { id: EX_SKI, canonicalName: "ski erg" },
  { id: EX_BURPEE, canonicalName: "burpee" },
  { id: EX_LUNGE, canonicalName: "walking lunge" },
]);

const WORKING_DAY = makeWorkingDay([SESSION_ONE, SESSION_TWO]);

const projectedWorkingDay = (): {
  dayTrainings: { trainingNumber: number; blocks: { name: string; exercises: string[] }[] }[];
} => {
  const result = projectDay(WORKING_DAY, EXERCISES);

  if (result.isRestDay !== false) {
    throw new Error("expected a working day projection");
  }

  return result.dailyProgram;
};

describe("mobile-publish projection parity (D-5 / D-8 SSOT)", () => {
  describe("renderRowLine is the single source of truth for the published line", () => {
    it("emits, for every row, exactly what renderRowLine renders for that mapped row", () => {
      const dailyProgram = projectedWorkingDay();

      WORKING_DAY.sessions.forEach((session, sessionIndex) => {
        const projectedTraining = dailyProgram.dayTrainings[sessionIndex];

        expect(projectedTraining).toBeDefined();

        session.blocks.forEach((prismaBlock, blockIndex) => {
          const block = mapToBlockWithSchemas(prismaBlock);
          const expectedLines = block.schemas.flatMap((schemaWithBody) =>
            schemaWithBody.rows.map((row) =>
              renderRowLine(row, EXERCISES, {
                blockIntensity: block.intensity,
                schemaIntensity: schemaWithBody.schema.intensity,
              }),
            ),
          );

          expect(projectedTraining?.blocks[blockIndex]?.exercises).toEqual(expectedLines);
        });
      });
    });
  });

  describe("projectDay flattens and orders what renderRowLine produces", () => {
    it("numbers trainings 1-based by session order, not by session.order (steps of 10)", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings.map((training) => training.trainingNumber)).toEqual([1, 2]);
    });

    it("selects the first block label as the block name", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[0]?.blocks.map((block) => block.name)).toEqual([
        "Strength",
        "Conditioning",
        "Cooldown",
      ]);
    });

    it("falls back to an empty block name for an unlabelled block", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[1]?.blocks[0]?.name).toBe("");
    });

    it("projects an empty block to exercises: []", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[0]?.blocks[2]).toEqual({ name: "Cooldown", exercises: [] });
    });

    it("flattens schema rows in authored schema-then-row order", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[0]?.blocks[1]?.exercises).toEqual([
        "run PACE · HARD",
        "bike HR Z3",
        "ski erg 5:00 / km",
        "burpee 8–12 reps",
      ]);
    });

    it("returns { isRestDay: true } and no dailyProgram for a rest-labelled day", () => {
      const result = projectDay(makeRestDay(), new Map());

      expect(result).toEqual({ isRestDay: true });
      expect(result).not.toHaveProperty("dailyProgram");
    });
  });

  describe("drift sentinel: published text breaks loudly if any formatter changes", () => {
    it("renders every load kind to its authored line", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[0]?.blocks[0]?.exercises).toEqual([
        "back squat 5 × 3 reps @80% of 1RM each leg 3-1-1-0 EFFORT 70–80% RPE 8 rest 120s between sets from sofa keep the chest up",
        "deadlift @100kg EFFORT 70–80%",
        "press Male:60 / Female:40 EFFORT 70–80%",
        "pull up BW EFFORT 70–80%",
      ]);
    });

    it("renders the paired-absolute and alternating-side rows of the second training", () => {
      const dailyProgram = projectedWorkingDay();

      expect(dailyProgram.dayTrainings[1]?.blocks[0]?.exercises).toEqual([
        "row @2x24kg",
        "walking lunge alternating",
      ]);
    });

    it("locks the text of all five intensity dimensions, inherited and own", () => {
      const dailyProgram = projectedWorkingDay();
      const firstTraining = dailyProgram.dayTrainings[0];

      expect(firstTraining?.blocks[0]?.exercises[0]).toContain("EFFORT 70–80%");
      expect(firstTraining?.blocks[0]?.exercises[0]).toContain("RPE 8");
      expect(firstTraining?.blocks[1]?.exercises).toEqual([
        "run PACE · HARD",
        "bike HR Z3",
        "ski erg 5:00 / km",
        "burpee 8–12 reps",
      ]);
    });
  });
});
