import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Exercise } from "@repo/contracts/lms/exercise";
import { type ExerciseById } from "@repo/contracts/lms/row-text";

import { type MobilePublishDayPayload } from "../day-include";

import { projectDay } from "./project-day";

const NOW = new Date("2026-06-26T00:00:00Z");
const WEEK_START = new Date("2026-06-22T00:00:00Z");

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

type PrismaSession = MobilePublishDayPayload["sessions"][number];
type PrismaBlock = PrismaSession["blocks"][number];
type PrismaSchema = PrismaBlock["schemas"][number];
type PrismaRow = PrismaSchema["rows"][number];

const SCHEMA_ID = cuid("sc");
const BLOCK_ID = cuid("b");

const exerciseRecord = (id: string, name: string): PrismaRow["exercise"] => ({
  id,
  canonicalName: name,
  canonicalNameLower: name.toLowerCase(),
  nature: "CONCRETE",
  defaultDemoUrls: [],
  aliases: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeRow = (over: {
  exerciseId: string;
  name: string;
  order: number;
  sets?: number | null;
  reps?: Prisma.JsonValue;
  load?: Prisma.JsonValue;
  intensity?: Prisma.JsonValue;
  tempo?: Prisma.JsonValue;
  side?: Prisma.JsonValue;
  rest?: Prisma.JsonValue;
  modifiers?: string[];
  notes?: string[] | null;
}): PrismaRow => ({
  id: cuid(`r${over.order}${over.exerciseId}`),
  schemaId: SCHEMA_ID,
  order: over.order,
  exerciseId: over.exerciseId,
  sets: over.sets ?? null,
  rowGroupId: null,
  load: over.load ?? null,
  reps: over.reps ?? null,
  side: over.side ?? null,
  tempo: over.tempo ?? null,
  media: null,
  intensity: over.intensity ?? null,
  rest: over.rest ?? null,
  notes: over.notes ?? null,
  createdAt: NOW,
  updatedAt: NOW,
  modifierAssignments: (over.modifiers ?? []).map((name, index) => ({
    id: cuid(`mod${index}${name}`),
    rowId: cuid(`r${over.order}${over.exerciseId}`),
    modifierId: cuid(`m${name}`),
    order: index,
    modifier: {
      id: cuid(`m${name}`),
      name,
      nameLower: name.toLowerCase(),
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  })),
  exercise: exerciseRecord(over.exerciseId, over.name),
});

const makeSchema = (over: {
  order: number;
  header?: string | null;
  composition?: Prisma.JsonValue;
  intensity?: Prisma.JsonValue;
  rows: PrismaRow[];
}): PrismaSchema => ({
  id: cuid(`s${over.order}`),
  blockId: BLOCK_ID,
  groupId: null,
  order: over.order,
  header: over.header ?? null,
  composition: over.composition ?? null,
  intensity: over.intensity ?? null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows: over.rows,
  rowGroups: [],
});

const makeBlock = (over: {
  order?: number;
  labelName?: string;
  intensity?: Prisma.JsonValue;
  schemas: PrismaSchema[];
}): PrismaBlock => ({
  id: BLOCK_ID,
  sessionId: cuid("sess"),
  order: over.order ?? 1,
  intensity: over.intensity ?? null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  labelAssignments:
    over.labelName === undefined
      ? []
      : [
          {
            id: cuid("la"),
            blockId: BLOCK_ID,
            labelId: cuid("lbl"),
            order: 0,
            label: {
              id: cuid("lbl"),
              name: over.labelName,
              nameLower: over.labelName.toLowerCase(),
              applicableLevels: ["BLOCK"],
              notes: null,
              rest: false,
              createdAt: NOW,
              updatedAt: NOW,
            },
          },
        ],
  schemas: over.schemas,
  groups: [],
});

const makeSession = (order: number, blocks: PrismaBlock[]): PrismaSession => ({
  id: cuid(`session${order}`),
  dayId: cuid("day"),
  order,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  blocks,
});

const makeDay = (over: {
  isRest?: boolean;
  sessions?: PrismaSession[];
}): MobilePublishDayPayload => ({
  id: cuid("day"),
  weekId: cuid("week"),
  dayOfWeek: "MONDAY",
  labelId: over.isRest === true ? cuid("restlbl") : null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  week: { startDate: WEEK_START },
  label:
    over.isRest === true
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
  sessions: over.sessions ?? [],
});

const makeExerciseById = (entries: [string, string][]): ExerciseById =>
  new Map<string, Exercise>(
    entries.map(([id, name]) => [
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

const EMPTY_EXERCISES: ExerciseById = new Map();

const projectBlockExercises = (block: PrismaBlock, exerciseById: ExerciseById): string[] => {
  const result = projectDay(makeDay({ sessions: [makeSession(10, [block])] }), exerciseById);

  if (result.isRestDay !== false) {
    throw new Error("expected a working day");
  }

  return result.dailyProgram.dayTrainings[0]?.blocks[0]?.exercises ?? [];
};

describe("projectDay — day-level structure (unchanged invariants)", () => {
  it("returns { isRestDay: true } and no dailyProgram for a rest-labelled day", () => {
    const result = projectDay(makeDay({ isRest: true }), EMPTY_EXERCISES);

    expect(result).toEqual({ isRestDay: true });
    expect(result).not.toHaveProperty("dailyProgram");
  });

  it("projects a non-rest day with zero sessions to empty dayTrainings", () => {
    const result = projectDay(makeDay({ sessions: [] }), EMPTY_EXERCISES);

    expect(result).toEqual({ isRestDay: false, dailyProgram: { dayTrainings: [] } });
  });

  it("numbers trainings 1-based by session order, not by session.order (steps of 10)", () => {
    const day = makeDay({ sessions: [makeSession(10, []), makeSession(20, [])] });
    const result = projectDay(day, EMPTY_EXERCISES);

    expect(result.isRestDay).toBe(false);

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings.map((t) => t.trainingNumber)).toEqual([1, 2]);
    }
  });

  it("uses the first block label as the block name, empty string when unlabelled", () => {
    const labelled = projectDay(
      makeDay({ sessions: [makeSession(10, [makeBlock({ labelName: "metcon", schemas: [] })])] }),
      EMPTY_EXERCISES,
    );
    const unlabelled = projectDay(
      makeDay({ sessions: [makeSession(10, [makeBlock({ schemas: [] })])] }),
      EMPTY_EXERCISES,
    );

    if (labelled.isRestDay === false && unlabelled.isRestDay === false) {
      expect(labelled.dailyProgram.dayTrainings[0]?.blocks[0]?.name).toBe("metcon");
      expect(unlabelled.dailyProgram.dayTrainings[0]?.blocks[0]?.name).toBe("");
    }
  });

  it("projects a block with no schemas to exercises: []", () => {
    const exercises = projectBlockExercises(
      makeBlock({ labelName: "core", schemas: [] }),
      EMPTY_EXERCISES,
    );

    expect(exercises).toEqual([]);
  });

  it("drops a schema that has no header, no composition and no rows", () => {
    const block = makeBlock({ labelName: "core", schemas: [makeSchema({ order: 1, rows: [] })] });

    expect(projectBlockExercises(block, EMPTY_EXERCISES)).toEqual([]);
  });
});

describe("projectDay — schema-aware text (publish-syntax v2, D-13)", () => {
  it("AMRAP: structure + intensity once in a header, then reps-first bracketed movement lines", () => {
    const ski = cuid("exski");
    const lunge = cuid("exlunge");
    const clean = cuid("exclean");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          header: "AMRAP",
          composition: { repetition: { kind: "timeCap", cap: { min: 20, unit: "min" } } },
          intensity: { effortPercent: { value: 80 } },
          rows: [
            makeRow({
              exerciseId: ski,
              name: "Ski",
              order: 1,
              reps: { kind: "unit_bound", unit: "cal", value: 18 },
              load: profileLoad([{ rx: "RX", m: 18, f: 14 }]),
            }),
            makeRow({
              exerciseId: lunge,
              name: "DB walking lunges (Farmer carry hold)",
              order: 2,
              reps: { kind: "count", value: 14 },
              load: profileLoad([
                { rx: "RX", m: 22.5, f: 15 },
                { rx: "SC", m: 15, f: 10 },
              ]),
              modifiers: ["double DB"],
            }),
            makeRow({
              exerciseId: clean,
              name: "Power clean & Push jerk",
              order: 3,
              reps: { kind: "count", value: 10 },
              load: profileLoad([
                { rx: "RX", m: 50, f: 35 },
                { rx: "SC", m: 40, f: 25 },
              ]),
            }),
          ],
        }),
      ],
    });

    const exercises = projectBlockExercises(
      block,
      makeExerciseById([
        [ski, "Ski"],
        [lunge, "DB walking lunges (Farmer carry hold)"],
        [clean, "Power clean & Push jerk"],
      ]),
    );

    expect(exercises).toEqual([
      [
        "AMRAP 20’ | EFFORT 80%:",
        "",
        "18 cal Ski [ RX M:18 F:14 ]",
        "14 reps DB walking lunges (Farmer carry hold) [ RX M:22.5 F:15 / SC M:15 F:10 ] [ double DB ]",
        "10 reps Power clean & Push jerk [ RX M:50 F:35 / SC M:40 F:25 ]",
      ].join("\n"),
    ]);
  });

  it("labels a timeCap repetition as AMRAP (never cap) and never doubles a coach AMRAP header", () => {
    const burpee = cuid("exburp");
    const timeCapSchema = (header: string | null): PrismaSchema =>
      makeSchema({
        order: 1,
        header,
        composition: { repetition: { kind: "timeCap", cap: { min: 12, unit: "min" } } },
        rows: [
          makeRow({
            exerciseId: burpee,
            name: "burpee",
            order: 1,
            reps: { kind: "count", value: 10 },
          }),
        ],
      });
    const exById = makeExerciseById([[burpee, "burpee"]]);

    const [headered = ""] = projectBlockExercises(
      makeBlock({ labelName: "metcon", schemas: [timeCapSchema("AMRAP")] }),
      exById,
    );
    const [headerless = ""] = projectBlockExercises(
      makeBlock({ labelName: "metcon", schemas: [timeCapSchema(null)] }),
      exById,
    );

    expect(headered.split("\n")[0]).toBe("AMRAP 12’:");
    expect(headerless.split("\n")[0]).toBe("AMRAP 12’:");
    expect(headered).not.toContain("cap");
    expect(headered).not.toContain("AMRAP · AMRAP");
  });

  it("EMOM: keeps the coach header verbatim (trailing colon stripped) and appends the rest line", () => {
    const bike = cuid("exbike");
    const macho = cuid("exmacho");
    const block = makeBlock({
      labelName: "strength endurance",
      schemas: [
        makeSchema({
          order: 1,
          header: "EMOM 15 min | 5 rounds:",
          composition: {
            repetition: { kind: "cadence", rounds: 5, everyMin: 15 },
            rest: { scope: "between_rounds", duration: { unit: "sec", value: 60 } },
          },
          intensity: { effortPercent: { value: 80 } },
          rows: [
            makeRow({
              exerciseId: bike,
              name: "Echo Bike",
              order: 1,
              load: profileLoad([
                { rx: "RX", m: 12, f: 9 },
                { rx: "SC", m: 10, f: 7 },
              ]),
            }),
            makeRow({
              exerciseId: macho,
              name: '"MACHO MAN"',
              order: 2,
              load: profileLoad([
                { rx: "RX", m: 50, f: 35 },
                { rx: "SC", m: 40, f: 25 },
              ]),
            }),
          ],
        }),
      ],
    });

    const [entry] = projectBlockExercises(
      block,
      makeExerciseById([
        [bike, "Echo Bike"],
        [macho, '"MACHO MAN"'],
      ]),
    );

    expect(entry).toBe(
      [
        "EMOM 15 min | 5 rounds | EFFORT 80%:",
        "",
        "Echo Bike [ RX M:12 F:9 / SC M:10 F:7 ]",
        '"MACHO MAN" [ RX M:50 F:35 / SC M:40 F:25 ]',
        "rest 60s between rounds",
      ].join("\n"),
    );
  });

  it("a schema with no header and no composition renders only its movement lines", () => {
    const fsquat = cuid("exfsquat");
    const block = makeBlock({
      labelName: "strength",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({
              exerciseId: fsquat,
              name: "Front squats",
              order: 1,
              sets: 5,
              reps: { kind: "count", value: 3 },
              load: { kind: "percentage", value: 75, rangeMax: 80, reference: { scope: "self" } },
            }),
          ],
        }),
      ],
    });

    const [entry] = projectBlockExercises(block, makeExerciseById([[fsquat, "Front squats"]]));

    expect(entry).toBe("5 × 3 reps Front squats [ @75–80% of 1RM ]");
    expect(entry).not.toContain("\n");
  });

  it("publishes row side, tempo and modifiers but withholds coach row notes (MP-11)", () => {
    const squat = cuid("exsquat");
    const block = makeBlock({
      labelName: "strength",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({
              exerciseId: squat,
              name: "back squat",
              order: 1,
              sets: 5,
              reps: { kind: "count", value: 3 },
              load: { kind: "percentage", value: 80, reference: { scope: "self" } },
              side: { kind: "each_leg" },
              tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
              modifiers: ["from sofa"],
              notes: ["keep chest up"],
            }),
          ],
        }),
      ],
    });

    const [entry] = projectBlockExercises(block, makeExerciseById([[squat, "back squat"]]));

    expect(entry).toBe("5 × 3 reps back squat [ @80% of 1RM ] each leg [ 3-1-1-0 ] [ from sofa ]");
    expect(entry).not.toContain("keep chest up");
  });

  it("a headerless schema falls back to a composition-summary header line", () => {
    const thruster = cuid("exthr");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          composition: {
            repetition: { kind: "ladder", steps: [21, 15, 9] },
            benchmark: { resultType: "time" },
          },
          rows: [makeRow({ exerciseId: thruster, name: "thruster", order: 1 })],
        }),
      ],
    });

    const [entry] = projectBlockExercises(block, makeExerciseById([[thruster, "thruster"]]));

    expect(entry).toBe(["ladder 21-15-9 | benchmark time:", "", "thruster"].join("\n"));
  });

  it("renders block-level intensity once in each schema header, never on the movement lines", () => {
    const squat = cuid("exsquat");
    const block = makeBlock({
      labelName: "strength",
      intensity: { effortPercent: { range: { min: 70, max: 80 } } },
      schemas: [
        makeSchema({
          order: 1,
          header: "back squat",
          rows: [
            makeRow({
              exerciseId: squat,
              name: "back squat",
              order: 1,
              sets: 5,
              reps: { kind: "count", value: 3 },
            }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[squat, "back squat"]]));
    const [headerLine, , movementLine = ""] = entry.split("\n");

    expect(headerLine).toBe("back squat | EFFORT 70–80%:");
    expect(movementLine).toBe("5 × 3 reps back squat");
    expect(movementLine).not.toContain("EFFORT");
  });

  it("keeps row-OWN intensity on the movement line while the shared intensity stays in the header", () => {
    const run = cuid("exrun");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          header: "intervals",
          intensity: { effortPercent: { value: 80 } },
          rows: [makeRow({ exerciseId: run, name: "run", order: 1, intensity: { pace: "hard" } })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[run, "run"]]));
    const [headerLine, , movementLine = ""] = entry.split("\n");

    expect(headerLine).toBe("intervals | EFFORT 80%:");
    expect(movementLine).toBe("run PACE · HARD");
  });

  it("renders a header-only entry for an empty schema that still carries a header", () => {
    const block = makeBlock({
      labelName: "skill",
      schemas: [makeSchema({ order: 1, header: "PRACTICE [ 10 min ]", rows: [] })],
    });

    expect(projectBlockExercises(block, EMPTY_EXERCISES)).toEqual(["PRACTICE [ 10 min ]:"]);
  });

  it("projects two sessions in 1-based training order with their own blocks", () => {
    const press = cuid("express");
    const day = makeDay({
      sessions: [
        makeSession(10, [
          makeBlock({
            labelName: "strength",
            schemas: [
              makeSchema({
                order: 1,
                rows: [
                  makeRow({
                    exerciseId: press,
                    name: "press",
                    order: 1,
                    reps: { kind: "count", value: 5 },
                  }),
                ],
              }),
            ],
          }),
        ]),
        makeSession(20, [makeBlock({ labelName: "accessory", schemas: [] })]),
      ],
    });

    const result = projectDay(day, makeExerciseById([[press, "press"]]));

    if (result.isRestDay === false) {
      expect(result.dailyProgram.dayTrainings).toEqual([
        { trainingNumber: 1, blocks: [{ name: "strength", exercises: ["5 reps press"] }] },
        { trainingNumber: 2, blocks: [{ name: "accessory", exercises: [] }] },
      ]);
    }
  });
});

describe("projectDay — review follow-ups (PR #319)", () => {
  it("appends the structure label to a name header that holds an unrelated digit (REVIEW-1)", () => {
    const bike = cuid("exbikep2");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          header: "Part 2",
          composition: { repetition: { kind: "cadence", everyMin: 12, rounds: 10 } },
          rows: [makeRow({ exerciseId: bike, name: "Echo Bike", order: 1 })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[bike, "Echo Bike"]]));

    expect(entry.split("\n")[0]).toBe("Part 2 · EMOM 12’×10:");
  });

  it("keeps cap and benchmark in the header even with a coach header present (REVIEW-3)", () => {
    const thruster = cuid("exthrfran");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          header: "fran",
          composition: {
            repetition: { kind: "ladder", steps: [21, 15, 9] },
            cap: { min: 5, unit: "min" },
            benchmark: { resultType: "time" },
          },
          rows: [makeRow({ exerciseId: thruster, name: "thruster", order: 1 })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[thruster, "thruster"]]));

    expect(entry.split("\n")[0]).toBe("fran · ladder 21-15-9 | cap 5’ | benchmark time:");
  });

  it("keeps a cross-cutting cap on a counted, headered for-time schema (REVIEW-3)", () => {
    const burpee = cuid("exburpft");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          header: "5 rounds for time",
          composition: { repetition: { kind: "count", count: 5 }, cap: { min: 15, unit: "min" } },
          rows: [
            makeRow({
              exerciseId: burpee,
              name: "burpee",
              order: 1,
              reps: { kind: "count", value: 10 },
            }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[burpee, "burpee"]]));

    expect(entry.split("\n")[0]).toBe("5 rounds for time | cap 15’:");
  });

  it("wires range reps, alternating side, row rest, own intensities and varied loads (REVIEW-4)", () => {
    const thr = cuid("exthrw");
    const rower = cuid("exroww");
    const dl = cuid("exdlw");
    const bike = cuid("exbikew");
    const ski = cuid("exskiw");
    const block = makeBlock({
      labelName: "main",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({
              exerciseId: thr,
              name: "thruster",
              order: 1,
              reps: { kind: "range", min: 8, max: 12 },
              side: { kind: "alternating" },
              intensity: { rpe: { value: 8 } },
              rest: { scope: "between_sets", duration: { unit: "sec", value: 90 } },
            }),
            makeRow({
              exerciseId: rower,
              name: "row",
              order: 2,
              load: {
                kind: "byProfile",
                axes: [
                  { axisId: cuid("axlvl"), label: "level", values: ["RX", "SC"], binding: null },
                ],
                cells: [
                  { coords: ["RX"], kg: 60 },
                  { coords: ["SC"], kg: 50 },
                ],
              },
            }),
            makeRow({
              exerciseId: dl,
              name: "deadlift",
              order: 3,
              load: { kind: "absolute", count: 1, kg: 100 },
            }),
            makeRow({
              exerciseId: bike,
              name: "bike",
              order: 4,
              intensity: { hrZone: { zone: "Z3" } },
            }),
            makeRow({
              exerciseId: ski,
              name: "ski erg",
              order: 5,
              intensity: {
                numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
              },
            }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [thr, "thruster"],
        [rower, "row"],
        [dl, "deadlift"],
        [bike, "bike"],
        [ski, "ski erg"],
      ]),
    );

    expect(entry.split("\n")).toEqual([
      "8–12 reps thruster alternating RPE 8 rest 90s between sets",
      "row [ RX:60 / SC:50 ]",
      "deadlift [ @100kg ]",
      "bike HR Z3",
      "ski erg 5:00 / km",
    ]);
  });
});
