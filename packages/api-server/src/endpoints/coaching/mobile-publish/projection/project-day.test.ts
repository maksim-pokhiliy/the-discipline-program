import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type ExerciseById } from "@repo/contracts/lms/row-text";

import { type MobilePublishDayPayload } from "../day-include";

import { projectDay } from "./project-day";

const NOW = new Date("2026-06-07T12:00:00Z");

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

type PrismaRow =
  MobilePublishDayPayload["sessions"][number]["blocks"][number]["schemas"][number]["rows"][number];
type PrismaSchema =
  MobilePublishDayPayload["sessions"][number]["blocks"][number]["schemas"][number];
type PrismaBlock = MobilePublishDayPayload["sessions"][number]["blocks"][number];
type PrismaSession = MobilePublishDayPayload["sessions"][number];
type PrismaExercise = PrismaRow["exercise"];

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

const makeRow = (overrides: {
  id: string;
  schemaId: string;
  order: number;
  exerciseId: string;
  canonicalName: string;
  sets?: number | null;
  reps?: Prisma.JsonValue;
  load?: Load | null;
}): PrismaRow => ({
  id: overrides.id,
  schemaId: overrides.schemaId,
  order: overrides.order,
  exerciseId: overrides.exerciseId,
  sets: overrides.sets ?? null,
  rowGroupId: null,
  load: (overrides.load ?? null) as Prisma.JsonValue,
  reps: overrides.reps ?? null,
  side: null,
  tempo: null,
  media: null,
  intensity: null,
  rest: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  modifierAssignments: [],
  exercise: makeExerciseRecord(overrides.exerciseId, overrides.canonicalName),
});

const makeSchema = (
  id: string,
  blockId: string,
  order: number,
  rows: PrismaRow[],
): PrismaSchema => ({
  id,
  blockId,
  groupId: null,
  order,
  header: null,
  composition: null,
  intensity: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows,
  rowGroups: [],
});

const makeBlock = (overrides: {
  id: string;
  sessionId: string;
  order: number;
  labelName?: string;
  schemas: PrismaSchema[];
}): PrismaBlock => ({
  id: overrides.id,
  sessionId: overrides.sessionId,
  order: overrides.order,
  intensity: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  labelAssignments:
    overrides.labelName === undefined
      ? []
      : [
          {
            id: cuid(`${overrides.id}lblasg`),
            blockId: overrides.id,
            labelId: cuid(`${overrides.id}lbl`),
            order: 0,
            label: {
              id: cuid(`${overrides.id}lbl`),
              name: overrides.labelName,
              nameLower: overrides.labelName.toLowerCase(),
              applicableLevels: ["BLOCK"],
              notes: null,
              rest: false,
              createdAt: NOW,
              updatedAt: NOW,
            },
          },
        ],
  schemas: overrides.schemas,
  groups: [],
});

const makeSession = (
  id: string,
  dayId: string,
  order: number,
  blocks: PrismaBlock[],
): PrismaSession => ({
  id,
  dayId,
  order,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  blocks,
});

const makeDay = (overrides: {
  isRest?: boolean;
  sessions?: PrismaSession[];
}): MobilePublishDayPayload => ({
  id: cuid("day"),
  weekId: cuid("week"),
  dayOfWeek: "MONDAY",
  labelId: overrides.isRest === true ? cuid("restlbl") : null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  week: { startDate: new Date("2026-06-08T00:00:00Z") },
  label:
    overrides.isRest === true
      ? {
          id: cuid("restlbl"),
          name: "Rest",
          nameLower: "rest",
          applicableLevels: ["DAY"],
          notes: null,
          rest: true,
          createdAt: NOW,
          updatedAt: NOW,
        }
      : null,
  sessions: overrides.sessions ?? [],
});

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

const EMPTY_EXERCISES: ExerciseById = new Map();

describe("projectDay", () => {
  it("returns { isRestDay: true } and no dailyProgram for a rest-labelled day", () => {
    const result = projectDay(makeDay({ isRest: true }), EMPTY_EXERCISES);

    expect(result).toEqual({ isRestDay: true });
    expect(result).not.toHaveProperty("dailyProgram");
  });

  it("numbers trainings 1-based by session order, not by session.order (steps of 10)", () => {
    const dayId = cuid("day");
    const day = makeDay({
      sessions: [makeSession(cuid("s1"), dayId, 10, []), makeSession(cuid("s2"), dayId, 20, [])],
    });

    const result = projectDay(day, EMPTY_EXERCISES);

    expect(result.isRestDay).toBe(false);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings.map((t) => t.trainingNumber)).toEqual([1, 2]);
    }
  });

  it("projects an empty block to exercises: []", () => {
    const dayId = cuid("day");
    const sessionId = cuid("s1");
    const blockId = cuid("b1");
    const day = makeDay({
      sessions: [
        makeSession(sessionId, dayId, 10, [
          makeBlock({ id: blockId, sessionId, order: 1, labelName: "Strength", schemas: [] }),
        ]),
      ],
    });

    const result = projectDay(day, EMPTY_EXERCISES);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings[0]?.blocks[0]).toEqual({
        name: "Strength",
        exercises: [],
      });
    }
  });

  it("flattens 2 schemas x N rows into exercises in exact schema-then-row order", () => {
    const dayId = cuid("day");
    const sessionId = cuid("s1");
    const blockId = cuid("b1");
    const exFirst = cuid("exa");
    const exSecond = cuid("exb");
    const exThird = cuid("exc");
    const day = makeDay({
      sessions: [
        makeSession(sessionId, dayId, 10, [
          makeBlock({
            id: blockId,
            sessionId,
            order: 1,
            labelName: "Main",
            schemas: [
              makeSchema(cuid("sc1"), blockId, 10, [
                makeRow({
                  id: cuid("r1"),
                  schemaId: cuid("sc1"),
                  order: 10,
                  exerciseId: exFirst,
                  canonicalName: "first",
                }),
                makeRow({
                  id: cuid("r2"),
                  schemaId: cuid("sc1"),
                  order: 20,
                  exerciseId: exSecond,
                  canonicalName: "second",
                }),
              ]),
              makeSchema(cuid("sc2"), blockId, 20, [
                makeRow({
                  id: cuid("r3"),
                  schemaId: cuid("sc2"),
                  order: 10,
                  exerciseId: exThird,
                  canonicalName: "third",
                }),
              ]),
            ],
          }),
        ]),
      ],
    });

    const exerciseById = makeExerciseById([
      { id: exFirst, canonicalName: "first" },
      { id: exSecond, canonicalName: "second" },
      { id: exThird, canonicalName: "third" },
    ]);

    const result = projectDay(day, exerciseById);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings[0]?.blocks[0]?.exercises).toEqual([
        "first",
        "second",
        "third",
      ]);
    }
  });

  it("uses the first block label as the block name", () => {
    const dayId = cuid("day");
    const sessionId = cuid("s1");
    const blockId = cuid("b1");
    const day = makeDay({
      sessions: [
        makeSession(sessionId, dayId, 10, [
          makeBlock({ id: blockId, sessionId, order: 1, labelName: "Conditioning", schemas: [] }),
        ]),
      ],
    });

    const result = projectDay(day, EMPTY_EXERCISES);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings[0]?.blocks[0]?.name).toBe("Conditioning");
    }
  });

  it("falls back to an empty block name for an unlabelled block", () => {
    const dayId = cuid("day");
    const sessionId = cuid("s1");
    const blockId = cuid("b1");
    const day = makeDay({
      sessions: [
        makeSession(sessionId, dayId, 10, [
          makeBlock({ id: blockId, sessionId, order: 1, schemas: [] }),
        ]),
      ],
    });

    const result = projectDay(day, EMPTY_EXERCISES);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings[0]?.blocks[0]?.name).toBe("");
    }
  });

  it("renders percentage, absolute, byProfile and bodyweight loads as their authored lines", () => {
    const dayId = cuid("day");
    const sessionId = cuid("s1");
    const blockId = cuid("b1");
    const schemaId = cuid("sc1");
    const exPct = cuid("expct");
    const exAbs = cuid("exabs");
    const exProf = cuid("exprof");
    const exBw = cuid("exbw");

    const day = makeDay({
      sessions: [
        makeSession(sessionId, dayId, 10, [
          makeBlock({
            id: blockId,
            sessionId,
            order: 1,
            labelName: "Main",
            schemas: [
              makeSchema(schemaId, blockId, 10, [
                makeRow({
                  id: cuid("rpct"),
                  schemaId,
                  order: 10,
                  exerciseId: exPct,
                  canonicalName: "back squat",
                  sets: 5,
                  reps: { kind: "count", value: 3 },
                  load: { kind: "percentage", value: 80, reference: { scope: "self" } },
                }),
                makeRow({
                  id: cuid("rabs"),
                  schemaId,
                  order: 20,
                  exerciseId: exAbs,
                  canonicalName: "deadlift",
                  load: { kind: "absolute", count: 1, kg: 100 },
                }),
                makeRow({
                  id: cuid("rprof"),
                  schemaId,
                  order: 30,
                  exerciseId: exProf,
                  canonicalName: "press",
                  load: {
                    kind: "byProfile",
                    axes: [
                      {
                        axisId: cuid("axisgender"),
                        label: "Gender",
                        values: ["M", "F"],
                        binding: "GENDER",
                      },
                    ],
                    cells: [
                      { coords: ["M"], kg: 60 },
                      { coords: ["F"], kg: 40 },
                    ],
                  },
                }),
                makeRow({
                  id: cuid("rbw"),
                  schemaId,
                  order: 40,
                  exerciseId: exBw,
                  canonicalName: "pull up",
                  load: { kind: "bodyweight" },
                }),
              ]),
            ],
          }),
        ]),
      ],
    });

    const exerciseById = makeExerciseById([
      { id: exPct, canonicalName: "back squat" },
      { id: exAbs, canonicalName: "deadlift" },
      { id: exProf, canonicalName: "press" },
      { id: exBw, canonicalName: "pull up" },
    ]);

    const result = projectDay(day, exerciseById);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings[0]?.blocks[0]?.exercises).toEqual([
        "back squat 5 × 3 reps @80% of 1RM",
        "deadlift @100kg",
        "press M:60 / F:40",
        "pull up BW",
      ]);
    }
  });
});
