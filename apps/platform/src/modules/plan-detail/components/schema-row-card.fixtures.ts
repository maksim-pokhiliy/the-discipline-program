import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import type { RowKind as BadgeKind } from "@repo/ui";

export const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
export const START_DATE = "2026-01-06";
export const NOW = new Date("2026-01-06T00:00:00.000Z");
export const ROW_ID = "ckrow1234567890abcdef01234";
export const SCHEMA_ID = "cksch1234567890abcdef01234";
export const ID_BACK_SQUAT = "ckabc1234567890abcdef01234";
export const ID_DEADLIFT = "ckxyz1234567890abcdef01234";
export const ID_PLACEHOLDER = "ckph01234567890abcdef01234";
export const ID_REST = "ckrest234567890abcdef01234";
export const DEMO_URL = "https://example.com/back-squat.mp4";

export const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
  id: overrides.id,
  canonicalName: overrides.canonicalName ?? "Back Squat",
  canonicalNameLower: overrides.canonicalNameLower ?? "back squat",
  nature: overrides.nature ?? "CONCRETE",
  movementFamily: overrides.movementFamily ?? "squat",
  defaultDemoUrls: overrides.defaultDemoUrls ?? [],
  aliases: overrides.aliases ?? [],
  equipment: overrides.equipment ?? [],
  notes: overrides.notes ?? null,
  createdAt: overrides.createdAt ?? NOW,
  updatedAt: overrides.updatedAt ?? NOW,
});

export const exerciseById: ReadonlyMap<string, Exercise> = new Map([
  [
    ID_BACK_SQUAT,
    makeExercise({ id: ID_BACK_SQUAT, canonicalName: "Back Squat", defaultDemoUrls: [DEMO_URL] }),
  ],
  [ID_DEADLIFT, makeExercise({ id: ID_DEADLIFT, canonicalName: "Deadlift" })],
  [
    ID_PLACEHOLDER,
    makeExercise({ id: ID_PLACEHOLDER, canonicalName: "Coach choice", nature: "PLACEHOLDER" }),
  ],
  [ID_REST, makeExercise({ id: ID_REST, canonicalName: "Rest", nature: "REST" })],
]);

const baseRowFields: Omit<SchemaRow, "exerciseId"> = {
  id: ROW_ID,
  schemaId: SCHEMA_ID,
  order: 1,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
};

export const makeExerciseRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  exerciseId: ID_BACK_SQUAT,
  ...overrides,
});

export const makeAtomicExerciseNoDemoRow = (): SchemaRow =>
  makeExerciseRow({ exerciseId: ID_DEADLIFT });

export const makePlaceholderRow = (): SchemaRow => makeExerciseRow({ exerciseId: ID_PLACEHOLDER });

export const makeRestRow = (): SchemaRow => makeExerciseRow({ exerciseId: ID_REST });

export type RowKindCase = {
  name: string;
  build: () => SchemaRow;
  index?: number;
  ord: string;
  badgeLabel: string;
  kindCls: BadgeKind;
  dashed: boolean;
  mainText: string;
  sub: string | null;
};

export const rowKindCases: RowKindCase[] = [
  {
    name: "atomic exercise",
    build: () => makeExerciseRow(),
    ord: "1",
    badgeLabel: "EX",
    kindCls: "ex",
    dashed: false,
    mainText: "Back Squat",
    sub: null,
  },
  {
    name: "placeholder exercise",
    build: () => makePlaceholderRow(),
    ord: "1",
    badgeLabel: "EX",
    kindCls: "ex",
    dashed: true,
    mainText: "Coach choice",
    sub: null,
  },
  {
    name: "rest exercise",
    build: () => makeRestRow(),
    ord: "1",
    badgeLabel: "REST",
    kindCls: "rest",
    dashed: false,
    mainText: "Rest",
    sub: null,
  },
];
