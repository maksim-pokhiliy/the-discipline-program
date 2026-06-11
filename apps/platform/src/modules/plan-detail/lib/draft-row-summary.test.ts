import { describe, expect, it } from "vitest";

import type { Load, RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeRow } from "../components/axes/axis-draft.types";
import { makeExercise } from "../components/schema-row-card.fixtures";

import { asNodeId } from "./axis-draft-id";
import { buildRowSummary } from "./draft-row-summary";

const ID_KETTLEBELL_SWING = "ckkbswing1234567890abcdef0";
const ID_THRUSTERS = "ckthruster1234567890abcde0";
const ID_PULL_UP = "ckpullup12345678901234567a";
const ID_DIP = "ckdip1234567890123456789ab";

const NAME_KETTLEBELL_SWING = "Kettlebell Swing";
const NAME_THRUSTERS = "Thrusters";
const NAME_PULL_UP = "Pull-up";
const NAME_DIP = "Dip";

const exerciseById = new Map<string, Exercise>([
  [
    ID_KETTLEBELL_SWING,
    makeExercise({ id: ID_KETTLEBELL_SWING, canonicalName: NAME_KETTLEBELL_SWING }),
  ],
  [ID_THRUSTERS, makeExercise({ id: ID_THRUSTERS, canonicalName: NAME_THRUSTERS })],
  [ID_PULL_UP, makeExercise({ id: ID_PULL_UP, canonicalName: NAME_PULL_UP })],
  [ID_DIP, makeExercise({ id: ID_DIP, canonicalName: NAME_DIP })],
]);

const KG_24: Load = { kind: "absolute", weight: { variant: "single", valueKg: 24 } };
const COUNT_10: RepNotation = { kind: "count", value: 10 };

const baseRow = (id: string): Omit<ComposeRow, "rowKind" | "rowPayload"> => ({
  nodeType: "row",
  id: asNodeId(id),
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: undefined,
});

const atomicRow = (
  id: string,
  exerciseId: string,
  load: Load,
  reps: RepNotation | null,
): ComposeRow => ({
  ...baseRow(id),
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId } },
  load,
  reps,
});

const compoundRow = (
  id: string,
  elements: { exerciseId: string; reps: RepNotation }[],
): ComposeRow => ({
  ...baseRow(id),
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "compound", compound: { elements } } },
});

const restRow = (id: string, valueSec: number): ComposeRow => ({
  ...baseRow(id),
  rowKind: "REST",
  rowPayload: {
    rowKind: "REST",
    raw: `${valueSec} sec`,
    parsed: { duration: { value: valueSec, unit: "sec" }, scope: "between_rounds" },
  },
});

describe("buildRowSummary", () => {
  it("renders an atomic exercise as name then load then reps", () => {
    const summary = buildRowSummary(
      atomicRow("t-atomic", ID_KETTLEBELL_SWING, KG_24, COUNT_10),
      exerciseById,
    );

    expect(summary.badge.label).toBe("EX");
    expect(summary.label).toBe(`${NAME_KETTLEBELL_SWING} · 24 kg · 10 reps`);
  });

  it("renders a compound exercise with per-element reps and names", () => {
    const row = compoundRow("t-compound", [
      { exerciseId: ID_PULL_UP, reps: { kind: "count", value: 5 } },
      { exerciseId: ID_DIP, reps: { kind: "count", value: 10 } },
    ]);

    expect(buildRowSummary(row, exerciseById).label).toBe(`5 ${NAME_PULL_UP} + 10 ${NAME_DIP}`);
  });

  it("omits null reps so a container-driven scheme is not duplicated on the row", () => {
    const row = atomicRow("t-no-reps", ID_THRUSTERS, KG_24, null);

    expect(buildRowSummary(row, exerciseById).label).toBe(`${NAME_THRUSTERS} · 24 kg`);
  });

  it("renders a rest row as its raw duration with the RST badge", () => {
    const summary = buildRowSummary(restRow("t-rest", 60), exerciseById);

    expect(summary.badge.label).toBe("RST");
    expect(summary.label).toBe("60 sec");
  });
});
