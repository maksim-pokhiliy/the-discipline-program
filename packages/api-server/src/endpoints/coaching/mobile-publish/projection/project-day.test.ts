import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Exercise } from "@repo/contracts/lms/exercise";
import { type ExerciseById } from "@repo/contracts/lms/row-text";
import { type ParallelInterleaveOrder } from "@repo/contracts/lms/schema-group";

import { type MobilePublishDayPayload } from "../day-include";

import { projectDay } from "./project-day";

const NOW = new Date("2026-06-26T00:00:00Z");
const WEEK_START = new Date("2026-06-22T00:00:00Z");

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

type PrismaSession = MobilePublishDayPayload["sessions"][number];
type PrismaBlock = PrismaSession["blocks"][number];
type PrismaSchema = PrismaBlock["schemas"][number];
type PrismaRow = PrismaSchema["rows"][number];
type PrismaSchemaGroup = PrismaBlock["groups"][number];
type PrismaRowGroup = PrismaSchema["rowGroups"][number];

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
  rowGroupId?: string | null;
}): PrismaRow => ({
  id: cuid(`r${over.order}${over.exerciseId}`),
  schemaId: SCHEMA_ID,
  order: over.order,
  exerciseId: over.exerciseId,
  sets: over.sets ?? null,
  rowGroupId: over.rowGroupId ?? null,
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
  groupId?: string | null;
  rows: PrismaRow[];
  rowGroups?: PrismaRowGroup[];
}): PrismaSchema => ({
  id: cuid(`s${over.order}`),
  blockId: BLOCK_ID,
  groupId: over.groupId ?? null,
  order: over.order,
  header: over.header ?? null,
  composition: over.composition ?? null,
  intensity: over.intensity ?? null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows: over.rows,
  rowGroups: over.rowGroups ?? [],
});

const makeRowGroup = (over: { id: string; notes?: string[] | null }): PrismaRowGroup => ({
  id: over.id,
  schemaId: SCHEMA_ID,
  notes: over.notes ?? null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeSchemaGroup = (over: {
  id: string;
  interleaveOrder?: ParallelInterleaveOrder;
  notes?: string[] | null;
}): PrismaSchemaGroup => ({
  id: over.id,
  blockId: BLOCK_ID,
  notes: over.notes ?? null,
  interleaveOrder: over.interleaveOrder ?? "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
});

const makeBlock = (over: {
  order?: number;
  labelName?: string;
  intensity?: Prisma.JsonValue;
  schemas: PrismaSchema[];
  groups?: PrismaSchemaGroup[];
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
  groups: over.groups ?? [],
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

describe("projectDay — count repetition with a present header (RC-1)", () => {
  it("appends the count rounds label to a present header through the shared separator", () => {
    const snatch = cuid("exsnatch");
    const block = makeBlock({
      labelName: "strength",
      schemas: [
        makeSchema({
          order: 1,
          header: "BSS DROP COMPLEX",
          composition: { repetition: { kind: "count", count: 3 } },
          rows: [
            makeRow({
              exerciseId: snatch,
              name: "DB snatch",
              order: 1,
              reps: { kind: "count", value: 8 },
            }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[snatch, "DB snatch"]]));

    expect(entry.split("\n")[0]).toBe("BSS DROP COMPLEX · 3 rounds:");
  });

  it("keeps the trailing rest line after a header-counted, uniform schema body", () => {
    const squat = cuid("exsesquat");
    const block = makeBlock({
      labelName: "strength endurance",
      schemas: [
        makeSchema({
          order: 1,
          header: "STRENGTH ENDURANCE",
          composition: {
            repetition: { kind: "count", count: 4 },
            rest: { scope: "between_sets", duration: { unit: "sec", value: 90 } },
          },
          rows: [
            makeRow({
              exerciseId: squat,
              name: "Back squat",
              order: 1,
              reps: { kind: "count", value: 5 },
            }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(block, makeExerciseById([[squat, "Back squat"]]));

    expect(entry).toBe(
      ["STRENGTH ENDURANCE · 4 rounds:", "", "5 reps Back squat", "rest 90s between sets"].join(
        "\n",
      ),
    );
  });
});

describe("projectDay — schema groups / parallel tracks (RC-2)", () => {
  const fran = cuid("exfrantrk");
  const franMember = (order: number, groupId: string): PrismaSchema =>
    makeSchema({
      order,
      groupId,
      header: "fran",
      composition: {
        repetition: { kind: "ladder", steps: [21, 15, 9] },
        benchmark: { resultType: "time" },
      },
      rows: [makeRow({ exerciseId: fran, name: "Thrusters", order: 1 })],
    });

  it("renders a track_by_track wrapper line then one entry per member schema", () => {
    const groupId = cuid("grptbt");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [franMember(1, groupId), franMember(2, groupId)],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "track_by_track" })],
    });

    const exercises = projectBlockExercises(block, makeExerciseById([[fran, "Thrusters"]]));

    expect(exercises).toHaveLength(3);
    expect(exercises[0]).toBe("2 tracks — one after another:");
    expect(exercises[1]?.split("\n")[0]).toBe("fran · ladder 21-15-9 | benchmark time:");
    expect(exercises[2]?.split("\n")[0]).toBe("fran · ladder 21-15-9 | benchmark time:");
  });

  it("words the wrapper as alternating rounds for a round_by_round group", () => {
    const groupId = cuid("grprbr");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [franMember(1, groupId), franMember(2, groupId)],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "round_by_round" })],
    });

    const exercises = projectBlockExercises(block, makeExerciseById([[fran, "Thrusters"]]));

    expect(exercises[0]).toBe("2 tracks — alternating rounds:");
  });

  it("uses the singular track noun for a one-member group", () => {
    const groupId = cuid("grpsolo");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [franMember(1, groupId)],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "track_by_track" })],
    });

    const exercises = projectBlockExercises(block, makeExerciseById([[fran, "Thrusters"]]));

    expect(exercises[0]).toBe("1 track — one after another:");
  });

  it("contributes nothing when every member of a group renders empty (no orphan wrapper)", () => {
    const groupId = cuid("grpempty");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({ order: 1, groupId, rows: [] }),
        makeSchema({ order: 2, groupId, rows: [] }),
      ],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "track_by_track" })],
    });

    expect(projectBlockExercises(block, EMPTY_EXERCISES)).toEqual([]);
  });

  it("counts only the rendered tracks when one group member renders empty (QA-001)", () => {
    const groupId = cuid("grppartial");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({ order: 1, groupId, header: "track A", rows: [] }),
        makeSchema({ order: 2, groupId, rows: [] }),
        makeSchema({ order: 3, groupId, header: "track C", rows: [] }),
      ],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "track_by_track" })],
    });

    const exercises = projectBlockExercises(block, EMPTY_EXERCISES);

    expect(exercises).toHaveLength(3);
    expect(exercises[0]).toBe("2 tracks — one after another:");
    expect(exercises[1]).toBe("track A:");
    expect(exercises[2]).toBe("track C:");
  });

  it("interleaves ungrouped schemas around a schema-group by representative order", () => {
    const groupId = cuid("grpinter");
    const first = cuid("exfirst");
    const m2 = cuid("exmtwo");
    const m3 = cuid("exmthree");
    const fourth = cuid("exfourth");
    const oneRow = (exerciseId: string, name: string): PrismaRow[] => [
      makeRow({ exerciseId, name, order: 1, reps: { kind: "count", value: 5 } }),
    ];
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({ order: 1, header: "first", rows: oneRow(first, "First") }),
        makeSchema({ order: 2, groupId, header: "m2", rows: oneRow(m2, "Second") }),
        makeSchema({ order: 3, groupId, header: "m3", rows: oneRow(m3, "Third") }),
        makeSchema({ order: 4, header: "fourth", rows: oneRow(fourth, "Fourth") }),
      ],
      groups: [makeSchemaGroup({ id: groupId, interleaveOrder: "round_by_round" })],
    });

    const exercises = projectBlockExercises(
      block,
      makeExerciseById([
        [first, "First"],
        [m2, "Second"],
        [m3, "Third"],
        [fourth, "Fourth"],
      ]),
    );

    expect(exercises).toHaveLength(5);
    expect(exercises[0]?.split("\n")[0]).toBe("first:");
    expect(exercises[1]).toBe("2 tracks — alternating rounds:");
    expect(exercises[2]?.split("\n")[0]).toBe("m2:");
    expect(exercises[3]?.split("\n")[0]).toBe("m3:");
    expect(exercises[4]?.split("\n")[0]).toBe("fourth:");
  });
});

describe("projectDay — row groups / coach separators (RC-3)", () => {
  it("labels a named row-group above its members and keeps ungrouped rows in place", () => {
    const bike = cuid("exrgbike");
    const inchworm = cuid("exrginch");
    const scap = cuid("exrgscap");
    const rowGroupId = cuid("rgsuper");
    const block = makeBlock({
      labelName: "warm-up",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({
              exerciseId: bike,
              name: "Echo Bike",
              order: 1,
              reps: { kind: "unit_bound", unit: "cal", value: 10 },
            }),
            makeRow({
              exerciseId: inchworm,
              name: "Inchworm",
              order: 2,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: scap,
              name: "Scap Pull-ups",
              order: 3,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
          ],
          rowGroups: [makeRowGroup({ id: rowGroupId, notes: ["super-set"] })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [bike, "Echo Bike"],
        [inchworm, "Inchworm"],
        [scap, "Scap Pull-ups"],
      ]),
    );

    expect(entry).toBe(
      ["10 cal Echo Bike", "super-set:", "5 reps Inchworm", "5 reps Scap Pull-ups"].join("\n"),
    );
  });

  it("renders descending round-labelled row-groups with no `· once` and the rest line last", () => {
    const calRow = cuid("excalrow");
    const pull = cuid("exrgpull");
    const round = (
      groupId: string,
      firstOrder: number,
      rowReps: number,
      pullReps: number,
    ): PrismaRow[] => [
      makeRow({
        exerciseId: calRow,
        name: "Cal row",
        order: firstOrder,
        reps: { kind: "count", value: rowReps },
        rowGroupId: groupId,
      }),
      makeRow({
        exerciseId: pull,
        name: "Pull-ups",
        order: firstOrder + 1,
        reps: { kind: "count", value: pullReps },
        rowGroupId: groupId,
      }),
    ];
    const rg1 = cuid("rground1");
    const rg2 = cuid("rground2");
    const rg3 = cuid("rground3");
    const block = makeBlock({
      labelName: "strength endurance",
      schemas: [
        makeSchema({
          order: 1,
          header: "STRENGTH ENDURANCE | 2 sets | 1 set is",
          composition: {
            repetition: { kind: "once" },
            rest: { scope: "between_sets", duration: { unit: "min", value: 5 } },
          },
          rows: [...round(rg1, 1, 18, 9), ...round(rg2, 3, 14, 7), ...round(rg3, 5, 10, 5)],
          rowGroups: [
            makeRowGroup({ id: rg1, notes: ["1st round:"] }),
            makeRowGroup({ id: rg2, notes: ["2nd round:"] }),
            makeRowGroup({ id: rg3, notes: ["3rd round:"] }),
          ],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [calRow, "Cal row"],
        [pull, "Pull-ups"],
      ]),
    );

    expect(entry).toBe(
      [
        "STRENGTH ENDURANCE | 2 sets | 1 set is:",
        "",
        "1st round:",
        "18 reps Cal row",
        "9 reps Pull-ups",
        "2nd round:",
        "14 reps Cal row",
        "7 reps Pull-ups",
        "3rd round:",
        "10 reps Cal row",
        "5 reps Pull-ups",
        "rest 5 min between sets",
      ].join("\n"),
    );
    expect(entry).not.toContain("once");
  });

  it("sets an unnamed row-group apart with one blank line and no synthetic label", () => {
    const a = cuid("exunga");
    const b = cuid("exungb");
    const c = cuid("exungc");
    const rowGroupId = cuid("rgunnamed");
    const block = makeBlock({
      labelName: "core",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({ exerciseId: a, name: "A", order: 1, reps: { kind: "count", value: 5 } }),
            makeRow({
              exerciseId: b,
              name: "B",
              order: 2,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: c,
              name: "C",
              order: 3,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
          ],
          rowGroups: [makeRowGroup({ id: rowGroupId })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [a, "A"],
        [b, "B"],
        [c, "C"],
      ]),
    );

    expect(entry.split("\n")).toEqual(["5 reps A", "", "5 reps B", "5 reps C"]);
    expect(entry).not.toContain("ROW GROUP");
  });

  it("omits the leading blank when an unnamed row-group starts the body", () => {
    const b = cuid("exsolob");
    const c = cuid("exsoloc");
    const rowGroupId = cuid("rgsolo");
    const block = makeBlock({
      labelName: "core",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({
              exerciseId: b,
              name: "B",
              order: 1,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: c,
              name: "C",
              order: 2,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
          ],
          rowGroups: [makeRowGroup({ id: rowGroupId })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [b, "B"],
        [c, "C"],
      ]),
    );

    expect(entry.split("\n")).toEqual(["5 reps B", "5 reps C"]);
  });

  it("orders ungrouped rows around a group by representative order", () => {
    const one = cuid("exordone");
    const two = cuid("exordtwo");
    const three = cuid("exordthree");
    const four = cuid("exordfour");
    const rowGroupId = cuid("rgmiddle");
    const block = makeBlock({
      labelName: "core",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({ exerciseId: one, name: "One", order: 1, reps: { kind: "count", value: 5 } }),
            makeRow({
              exerciseId: two,
              name: "Two",
              order: 2,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: three,
              name: "Three",
              order: 3,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: four,
              name: "Four",
              order: 4,
              reps: { kind: "count", value: 5 },
            }),
          ],
          rowGroups: [makeRowGroup({ id: rowGroupId, notes: ["round:"] })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [one, "One"],
        [two, "Two"],
        [three, "Three"],
        [four, "Four"],
      ]),
    );

    expect(entry.split("\n")).toEqual([
      "5 reps One",
      "round:",
      "5 reps Two",
      "5 reps Three",
      "5 reps Four",
    ]);
  });

  it("treats a row-group note that normalizes to empty as unnamed, no bare colon line (QA-002)", () => {
    const a = cuid("excola");
    const b = cuid("excolb");
    const c = cuid("excolc");
    const rowGroupId = cuid("rgcolon");
    const block = makeBlock({
      labelName: "core",
      schemas: [
        makeSchema({
          order: 1,
          rows: [
            makeRow({ exerciseId: a, name: "A", order: 1, reps: { kind: "count", value: 5 } }),
            makeRow({
              exerciseId: b,
              name: "B",
              order: 2,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
            makeRow({
              exerciseId: c,
              name: "C",
              order: 3,
              reps: { kind: "count", value: 5 },
              rowGroupId,
            }),
          ],
          rowGroups: [makeRowGroup({ id: rowGroupId, notes: [":"] })],
        }),
      ],
    });

    const [entry = ""] = projectBlockExercises(
      block,
      makeExerciseById([
        [a, "A"],
        [b, "B"],
        [c, "C"],
      ]),
    );

    expect(entry.split("\n")).toEqual(["5 reps A", "", "5 reps B", "5 reps C"]);
    expect(entry.split("\n")).not.toContain(":");
  });
});

describe("projectDay — orphan membership fallback (defensive)", () => {
  it("renders an unknown groupId and an unknown rowGroupId as flat ungrouped content", () => {
    const move = cuid("exorphan");
    const block = makeBlock({
      labelName: "metcon",
      schemas: [
        makeSchema({
          order: 1,
          groupId: cuid("ghostgrp"),
          header: "orphan",
          rows: [
            makeRow({
              exerciseId: move,
              name: "Move",
              order: 1,
              reps: { kind: "count", value: 5 },
              rowGroupId: cuid("ghostrg"),
            }),
          ],
          rowGroups: [],
        }),
      ],
      groups: [],
    });

    const exercises = projectBlockExercises(block, makeExerciseById([[move, "Move"]]));

    expect(exercises).toEqual(["orphan:\n\n5 reps Move"]);
    expect(exercises[0]).not.toContain("track");
  });
});
