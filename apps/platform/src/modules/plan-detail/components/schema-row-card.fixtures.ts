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
export const DEMO_URL = "https://example.com/back-squat.mp4";

export const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
  id: overrides.id,
  canonicalName: overrides.canonicalName ?? "Back Squat",
  canonicalNameLower: overrides.canonicalNameLower ?? "back squat",
  primaryEquipment: overrides.primaryEquipment ?? "BARBELL",
  movementTypeTagPrimary: overrides.movementTypeTagPrimary ?? "SQUAT",
  movementTypeTagSecondary: overrides.movementTypeTagSecondary ?? null,
  canonicalCompoundType: overrides.canonicalCompoundType ?? "ATOMIC",
  placeholderFlag: overrides.placeholderFlag ?? false,
  movementFamily: overrides.movementFamily ?? "squat",
  defaultDemoUrls: overrides.defaultDemoUrls ?? [],
  aliases: overrides.aliases ?? [],
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
]);

const baseRowFields = {
  id: ROW_ID,
  schemaId: SCHEMA_ID,
  order: 1,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
} as const;

export const makeExerciseRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_BACK_SQUAT } },
  ...overrides,
});

export const makeCompoundExerciseRow = (): SchemaRow =>
  makeExerciseRow({
    rowPayload: {
      rowKind: "EXERCISE",
      exercise: {
        form: "compound",
        compound: {
          elements: [
            { exerciseId: ID_BACK_SQUAT, reps: { kind: "count", value: 5 } },
            { exerciseId: ID_DEADLIFT, reps: { kind: "count", value: 3 } },
          ],
        },
      },
    },
  });

export const makeAtomicExerciseNoDemoRow = (): SchemaRow =>
  makeExerciseRow({
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_DEADLIFT } },
  });

export const makeRestRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "REST",
  rowPayload: {
    rowKind: "REST",
    raw: "rest 90s",
    parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
  },
});

export const makePlaceholderRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "PLACEHOLDER",
  rowPayload: {
    rowKind: "PLACEHOLDER",
    placeholder: { placeholderKind: "coach_choice_slot", text: "ABS finisher" },
  },
});

export const makeRestSlotRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
});

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
    name: "EXERCISE atomic",
    build: () => makeExerciseRow(),
    ord: "1",
    badgeLabel: "EX",
    kindCls: "ex",
    dashed: false,
    mainText: "Back Squat",
    sub: null,
  },
  {
    name: "REST",
    build: () => makeRestRow(),
    index: 4,
    ord: "5",
    badgeLabel: "RST",
    kindCls: "rest",
    dashed: false,
    mainText: "rest 90s between sets",
    sub: null,
  },
  {
    name: "PLACEHOLDER",
    build: () => makePlaceholderRow(),
    ord: "?",
    badgeLabel: "?",
    kindCls: "placeholder",
    dashed: true,
    mainText: "ABS finisher",
    sub: "placeholder · coach choice slot",
  },
  {
    name: "REST_SLOT",
    build: () => makeRestSlotRow(),
    ord: "R",
    badgeLabel: "RS",
    kindCls: "rest",
    dashed: false,
    mainText: "Rest slot",
    sub: "EMOM minute · rest",
  },
];
