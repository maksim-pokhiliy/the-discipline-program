import { DayOfWeek } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { type AthleteLoadContext } from "../athlete-records";

import { buildSessionDetail, collectExerciseIds } from "./build-session-detail";
import {
  type BenchmarkResultRecord,
  type PerformedSessionRecord,
  type SessionDetailBlock,
  type SessionDetailRecord,
  type SessionDetailRow,
  type SessionDetailSchema,
} from "./session-detail.types";

const EPOCH = new Date("2026-01-01T00:00:00.000Z");
const MONDAY = new Date("2026-06-15T00:00:00.000Z");
const ROW_EXERCISE_ID = "clz0000000000000000exer01";
const OTHER_EXERCISE_ID = "clz0000000000000000exer02";

let counter = 0;

const cuid = (prefix: string): string => {
  counter += 1;

  return `clz000000000000000${prefix}${String(counter).padStart(3, "0")}`;
};

const makeExercise = (overrides: { id?: string; name?: string; demoUrls?: string[] } = {}) => ({
  id: overrides.id ?? ROW_EXERCISE_ID,
  canonicalName: overrides.name ?? "Back Squat",
  canonicalNameLower: (overrides.name ?? "Back Squat").toLowerCase(),
  nature: "CONCRETE" as const,
  defaultDemoUrls: overrides.demoUrls ?? [],
  aliases: null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const makeRowExercise = (exerciseId: string, demoUrls: string[] | undefined) =>
  demoUrls === undefined
    ? makeExercise({ id: exerciseId })
    : makeExercise({ id: exerciseId, demoUrls });

type RowOverrides = {
  id?: string;
  exerciseId?: string;
  load?: Load | null;
  sets?: number | null;
  modifierNames?: string[];
  demoUrls?: string[];
  mediaUrl?: string | null;
  rowGroupId?: string | null;
};

const makeRow = (overrides: RowOverrides = {}): SessionDetailRow => {
  const id = overrides.id ?? cuid("row");

  return {
    id,
    schemaId: "clz0000000000000000schm01",
    order: 1,
    exerciseId: overrides.exerciseId ?? ROW_EXERCISE_ID,
    sets: overrides.sets ?? null,
    rowGroupId: overrides.rowGroupId ?? null,
    load: overrides.load ?? null,
    reps: null,
    side: null,
    tempo: null,
    media: overrides.mediaUrl == null ? null : { url: overrides.mediaUrl },
    intensity: null,
    rest: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    exercise: makeRowExercise(overrides.exerciseId ?? ROW_EXERCISE_ID, overrides.demoUrls),
    modifierAssignments: (overrides.modifierNames ?? []).map((name, index) => ({
      id: cuid("rma"),
      rowId: id,
      modifierId: cuid("mod"),
      order: index + 1,
      modifier: {
        id: cuid("mod"),
        name,
        nameLower: name.toLowerCase(),
        notes: null,
        createdAt: EPOCH,
        updatedAt: EPOCH,
      },
    })),
  };
};

type SchemaOverrides = {
  id?: string;
  order?: number;
  header?: string | null;
  groupId?: string | null;
  composition?: SessionDetailSchema["composition"];
  rows?: SessionDetailRow[];
  rowGroupIds?: string[];
  rowGroupNotes?: string[] | null;
};

const makeSchema = (overrides: SchemaOverrides = {}): SessionDetailSchema => ({
  id: overrides.id ?? cuid("schm"),
  blockId: "clz0000000000000000blk001",
  groupId: overrides.groupId ?? null,
  order: overrides.order ?? 1,
  header: overrides.header ?? null,
  composition: overrides.composition ?? null,
  intensity: null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  rows: overrides.rows ?? [makeRow()],
  rowGroups: (overrides.rowGroupIds ?? []).map((id) => ({
    id,
    schemaId: overrides.id ?? "clz0000000000000000schm01",
    notes: overrides.rowGroupNotes ?? null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  })),
});

type BlockOverrides = {
  id?: string;
  intensity?: SessionDetailBlock["intensity"];
  notes?: SessionDetailBlock["notes"];
  labelNames?: string[];
  schemas?: SessionDetailSchema[];
  groupIds?: string[];
};

const makeBlock = (overrides: BlockOverrides = {}): SessionDetailBlock => {
  const id = overrides.id ?? cuid("blk");

  return {
    id,
    sessionId: "clz0000000000000000sess01",
    order: 1,
    intensity: overrides.intensity ?? null,
    notes: overrides.notes ?? null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    labelAssignments: (overrides.labelNames ?? []).map((name, index) => ({
      id: cuid("bla"),
      blockId: id,
      labelId: cuid("lbl"),
      order: index + 1,
      label: {
        id: cuid("lbl"),
        name,
        nameLower: name.toLowerCase(),
        applicableLevels: [],
        notes: null,
        rest: false,
        createdAt: EPOCH,
        updatedAt: EPOCH,
      },
    })),
    schemas: overrides.schemas ?? [makeSchema()],
    groups: (overrides.groupIds ?? []).map((groupId) => ({
      id: groupId,
      blockId: id,
      notes: null,
      interleaveOrder: "round_by_round",
      createdAt: EPOCH,
      updatedAt: EPOCH,
    })),
  };
};

type SessionOverrides = {
  sessionLabel?: string | null;
  dayLabel?: string | null;
  dayOfWeek?: DayOfWeek;
  startDate?: Date;
  planName?: string;
  weekIds?: string[];
  weekId?: string;
  blocks?: SessionDetailBlock[];
};

const WEEK_ID = "clz0000000000000000wk0001";

const makeSession = (overrides: SessionOverrides = {}): SessionDetailRecord => {
  const weekId = overrides.weekId ?? WEEK_ID;

  return {
    id: "clz0000000000000000sess01",
    dayId: "clz00000000000000000day01",
    order: 1,
    labelId: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    label: overrides.sessionLabel == null ? null : { name: overrides.sessionLabel },
    day: {
      id: "clz00000000000000000day01",
      weekId,
      dayOfWeek: overrides.dayOfWeek ?? DayOfWeek.MONDAY,
      labelId: null,
      notes: null,
      createdAt: EPOCH,
      updatedAt: EPOCH,
      label: overrides.dayLabel == null ? null : { name: overrides.dayLabel },
      week: {
        id: weekId,
        planId: "clz0000000000000000plan01",
        startDate: overrides.startDate ?? MONDAY,
        notes: null,
        createdAt: EPOCH,
        updatedAt: EPOCH,
        plan: {
          name: overrides.planName ?? "Strength Cycle",
          weeks: (overrides.weekIds ?? [weekId]).map((id) => ({ id })),
        },
      },
    },
    blocks: overrides.blocks ?? [makeBlock()],
  };
};

const LEVEL_AXIS_ID = "clz0000000000000000axis01";

const makeCtx = (overrides: Partial<AthleteLoadContext> = {}): AthleteLoadContext => ({
  bodyweightKg: null,
  currentOneRMByExercise: new Map(),
  profileSelections: {},
  gender: null,
  ...overrides,
});

const firstRowView = (response: ReturnType<typeof buildSessionDetail>) => {
  const item = response.blocks[0]?.items[0];

  if (item?.kind !== "schema") {
    throw new Error("expected a schema block item");
  }

  const rowItem = item.schema.items[0];

  if (rowItem?.kind !== "row") {
    throw new Error("expected a single row item");
  }

  return rowItem.row;
};

describe("buildSessionDetail load resolution", () => {
  it("resolves an absolute single-implement load", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({ rows: [makeRow({ load: { kind: "absolute", count: 1, kg: 40 } })] }),
          ],
        }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toEqual({
      status: "resolved",
      kg: 40,
      perHand: false,
    });
  });

  it("flags perHand for an absolute double-implement load", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({ rows: [makeRow({ load: { kind: "absolute", count: 2, kg: 16 } })] }),
          ],
        }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toEqual({
      status: "resolved",
      kg: 16,
      perHand: true,
    });
  });

  it("resolves a bodyweight load to the bodyweight status, never the athlete's weight", () => {
    const session = makeSession({
      blocks: [
        makeBlock({ schemas: [makeSchema({ rows: [makeRow({ load: { kind: "bodyweight" } })] })] }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({
          session,
          ctx: makeCtx({ bodyweightKg: 72 }),
          performed: [],
          latestResults: [],
        }),
      ).resolvedLoad,
    ).toEqual({ status: "bodyweight" });
  });

  it("resolves a self-referenced percentage against the row 1RM", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({
              rows: [
                makeRow({ load: { kind: "percentage", value: 80, reference: { scope: "self" } } }),
              ],
            }),
          ],
        }),
      ],
    });
    const ctx = makeCtx({ currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, 100]]) });

    expect(
      firstRowView(buildSessionDetail({ session, ctx, performed: [], latestResults: [] }))
        .resolvedLoad,
    ).toEqual({
      status: "resolved",
      kg: 80,
      perHand: false,
    });
  });

  it("resolves an other-exercise percentage against the target 1RM", () => {
    const load: Load = {
      kind: "percentage",
      value: 50,
      reference: { scope: "other_exercise", targetExerciseId: OTHER_EXERCISE_ID },
    };
    const session = makeSession({
      blocks: [makeBlock({ schemas: [makeSchema({ rows: [makeRow({ load })] })] })],
    });
    const ctx = makeCtx({ currentOneRMByExercise: new Map([[OTHER_EXERCISE_ID, 90]]) });

    expect(
      firstRowView(buildSessionDetail({ session, ctx, performed: [], latestResults: [] }))
        .resolvedLoad,
    ).toEqual({
      status: "resolved",
      kg: 45,
      perHand: false,
    });
  });

  it("emits missing_one_rm with the exercise id when no 1RM exists", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({
              rows: [
                makeRow({ load: { kind: "percentage", value: 80, reference: { scope: "self" } } }),
              ],
            }),
          ],
        }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toEqual({
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: ROW_EXERCISE_ID,
    });
  });

  it("emits missing_profile_pick labelling the unpicked axes", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const session = makeSession({
      blocks: [makeBlock({ schemas: [makeSchema({ rows: [makeRow({ load })] })] })],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("emits the bodyweight status for bodyweight with no recorded weight", () => {
    const session = makeSession({
      blocks: [
        makeBlock({ schemas: [makeSchema({ rows: [makeRow({ load: { kind: "bodyweight" } })] })] }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toEqual({
      status: "bodyweight",
    });
  });

  it("leaves resolvedLoad null when the row has no load", () => {
    const session = makeSession({
      blocks: [makeBlock({ schemas: [makeSchema({ rows: [makeRow({ load: null })] })] })],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).resolvedLoad,
    ).toBeNull();
  });
});

describe("buildSessionDetail header", () => {
  it("prefers the session label, then the day label, then Workout", () => {
    expect(
      buildSessionDetail({
        session: makeSession({ sessionLabel: "Back Squat" }),
        ctx: makeCtx(),
        performed: [],
        latestResults: [],
      }).session.title,
    ).toBe("Back Squat");
    expect(
      buildSessionDetail({
        session: makeSession({ dayLabel: "Lower Body" }),
        ctx: makeCtx(),
        performed: [],
        latestResults: [],
      }).session.title,
    ).toBe("Lower Body");
    expect(
      buildSessionDetail({
        session: makeSession(),
        ctx: makeCtx(),
        performed: [],
        latestResults: [],
      }).session.title,
    ).toBe("Workout");
  });

  it("derives the position eyebrow from the week ordinal, day ordinal, and plan name", () => {
    const session = makeSession({
      weekId: "clz0000000000000000wk0002",
      weekIds: ["clz0000000000000000wk0001", "clz0000000000000000wk0002"],
      dayOfWeek: DayOfWeek.THURSDAY,
      planName: "Strength Cycle",
    });

    expect(
      buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }).session
        .position,
    ).toBe("Week 2 · Day 4 · Strength Cycle");
  });

  it("uses a Monday-based day ordinal in the position eyebrow", () => {
    const sunday = makeSession({ dayOfWeek: DayOfWeek.SUNDAY, planName: "Strength Cycle" });

    expect(
      buildSessionDetail({ session: sunday, ctx: makeCtx(), performed: [], latestResults: [] })
        .session.position,
    ).toBe("Week 1 · Day 7 · Strength Cycle");
  });

  it("emits a tz-stable dayOfWeek and dayOfMonth from the absolute UTC date", () => {
    const session = makeSession({ dayOfWeek: DayOfWeek.WEDNESDAY, startDate: MONDAY });
    const header = buildSessionDetail({
      session,
      ctx: makeCtx(),
      performed: [],
      latestResults: [],
    }).session;

    expect(header.dayOfWeek).toBe("WEDNESDAY");
    expect(header.dayOfMonth).toBe(17);
  });

  it("rolls dayOfMonth across a month boundary", () => {
    const session = makeSession({
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startDate: new Date("2026-06-29T00:00:00.000Z"),
    });

    expect(
      buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }).session
        .dayOfMonth,
    ).toBe(1);
  });
});

describe("buildSessionDetail done and existingResult", () => {
  const performedAt = (iso: string): PerformedSessionRecord => ({
    id: cuid("perf"),
    sessionId: "clz0000000000000000sess01",
    userId: "clz0000000000000000user01",
    performedAt: new Date(iso),
    coachNotes: null,
    athleteNotes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  });

  const benchmarkResultAt = (
    schemaId: string,
    result: BenchmarkResultRecord["result"],
    iso: string,
  ): BenchmarkResultRecord => ({
    plannedSchemaId: schemaId,
    result,
    recordedAt: new Date(iso),
  });

  const loadBenchmarkSession = (schemaId: string): SessionDetailRecord =>
    makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({ id: schemaId, composition: { benchmark: { resultType: "load" } } }),
          ],
        }),
      ],
    });

  it("marks done and pins completedAt to the earliest performance, ignoring latestResults", () => {
    const performed = [
      performedAt("2026-06-15T10:00:00.000Z"),
      performedAt("2026-06-16T10:00:00.000Z"),
    ];
    const header = buildSessionDetail({
      session: makeSession(),
      ctx: makeCtx(),
      performed,
      latestResults: [],
    }).session;

    expect(header.done).toBe(true);
    expect(header.completedAt?.toISOString()).toBe("2026-06-15T10:00:00.000Z");
  });

  it("keeps done false and completedAt null when only a result is logged (Must-Test 4/14)", () => {
    const schemaId = "clz0000000000000000schm08";
    const header = buildSessionDetail({
      session: loadBenchmarkSession(schemaId),
      ctx: makeCtx(),
      performed: [],
      latestResults: [
        benchmarkResultAt(schemaId, { type: "load", kg: 100 }, "2026-06-18T10:00:00.000Z"),
      ],
    }).session;

    expect(header.done).toBe(false);
    expect(header.completedAt).toBeNull();
  });

  it("surfaces the latest logged result per benchmark schema from latestResults, not the best", () => {
    const schemaId = "clz0000000000000000schm09";
    const latestResults = [
      benchmarkResultAt(schemaId, { type: "load", kg: 120 }, "2026-06-15T10:00:00.000Z"),
      benchmarkResultAt(schemaId, { type: "load", kg: 90 }, "2026-06-18T10:00:00.000Z"),
    ];

    const response = buildSessionDetail({
      session: loadBenchmarkSession(schemaId),
      ctx: makeCtx(),
      performed: [],
      latestResults,
    });
    const item = response.blocks[0]?.items[0];

    expect(item?.kind).toBe("schema");

    if (item?.kind === "schema") {
      expect(item.schema.isBenchmark).toBe(true);
      expect(item.schema.resultType).toBe("load");
      expect(item.schema.existingResult).toEqual({ type: "load", kg: 90 });
    }
  });
});

describe("buildSessionDetail grouping", () => {
  it("emits a parallel-group with a trackCount equal to the member schemas", () => {
    const groupId = "clz0000000000000000grp001";
    const session = makeSession({
      blocks: [
        makeBlock({
          groupIds: [groupId],
          schemas: [
            makeSchema({ id: cuid("schm"), order: 1, groupId, header: "Track A" }),
            makeSchema({ id: cuid("schm"), order: 2, groupId, header: "Track B" }),
          ],
        }),
      ],
    });

    const item = buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] })
      .blocks[0]?.items[0];

    expect(item?.kind).toBe("parallel-group");

    if (item?.kind === "parallel-group") {
      expect(item.trackCount).toBe(2);
      expect(item.tracks.map((track) => track.header)).toEqual(["Track A", "Track B"]);
    }
  });

  it("emits a row group carrying its ordered members", () => {
    const groupId = "clz0000000000000000rgrp01";
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({
              rowGroupIds: [groupId],
              rowGroupNotes: ["super-set"],
              rows: [
                makeRow({ rowGroupId: groupId, exerciseId: ROW_EXERCISE_ID }),
                makeRow({ rowGroupId: groupId, exerciseId: OTHER_EXERCISE_ID }),
              ],
            }),
          ],
        }),
      ],
    });

    const blockItem = buildSessionDetail({
      session,
      ctx: makeCtx(),
      performed: [],
      latestResults: [],
    }).blocks[0]?.items[0];

    if (blockItem?.kind !== "schema") {
      throw new Error("expected a schema block item");
    }

    const rowItem = blockItem.schema.items[0];

    expect(rowItem?.kind).toBe("group");

    if (rowItem?.kind === "group") {
      expect(rowItem.label).toBe("super-set");
      expect(rowItem.members).toHaveLength(2);
    }
  });
});

describe("buildSessionDetail row presentation", () => {
  it("maps the movement name, modifiers, and media fallback to the exercise demo", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({
              rows: [
                makeRow({
                  modifierNames: ["Tempo", "Pause"],
                  demoUrls: ["https://demo.example/squat.mp4"],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const row = firstRowView(
      buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
    );

    expect(row.movement).toBe("Back Squat");
    expect(row.modifiers).toEqual(["Tempo", "Pause"]);
    expect(row.media).toBe("https://demo.example/squat.mp4");
  });

  it("prefers the row media override over the exercise demo", () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [
            makeSchema({
              rows: [
                makeRow({
                  mediaUrl: "https://demo.example/override.mp4",
                  demoUrls: ["https://demo.example/squat.mp4"],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    expect(
      firstRowView(
        buildSessionDetail({ session, ctx: makeCtx(), performed: [], latestResults: [] }),
      ).media,
    ).toBe("https://demo.example/override.mp4");
  });
});

describe("collectExerciseIds", () => {
  it("includes every row exercise plus other-exercise percentage targets", () => {
    const load: Load = {
      kind: "percentage",
      value: 60,
      reference: { scope: "other_exercise", targetExerciseId: OTHER_EXERCISE_ID },
    };
    const session = makeSession({
      blocks: [
        makeBlock({
          schemas: [makeSchema({ rows: [makeRow({ exerciseId: ROW_EXERCISE_ID, load })] })],
        }),
      ],
    });

    const ids = collectExerciseIds(session);

    expect(ids).toContain(ROW_EXERCISE_ID);
    expect(ids).toContain(OTHER_EXERCISE_ID);
  });
});
