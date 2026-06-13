import { describe, expect, it } from "vitest";

import type { ComposeRow, SchemaDraft } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import { shouldBeContainer } from "./should-be-container";

let rowCounter = 0;

const EXERCISE_ID = "ckexr1234567890abcdef01234";

const makeRow = (): ComposeRow => {
  rowCounter += 1;

  return {
    nodeType: "row",
    id: asNodeId(`predicate-row-${String(rowCounter)}`),
    exerciseId: EXERCISE_ID,
    sets: null,
    rowGroupId: null,
    reps: null,
    load: null,
    side: null,
    tempo: null,
    modifiers: [],
    notes: null,
    editorDraft: undefined,
  };
};

const schemaDraft = (overrides: Partial<SchemaDraft>): SchemaDraft => ({
  id: asNodeId("predicate-schema"),
  header: null,
  notes: null,
  rows: [],
  ...overrides,
});

const oneRow = (): ComposeRow[] => [makeRow()];
const twoRows = (): ComposeRow[] => [makeRow(), makeRow()];

describe("shouldBeContainer", () => {
  it("returns false for a bare single-row schema with no axes", () => {
    expect(shouldBeContainer(schemaDraft({ rows: oneRow() }))).toBe(false);
  });

  it("returns false for an empty schema with a once repetition", () => {
    const schema = schemaDraft({ repetition: { kind: "once" } });

    expect(shouldBeContainer(schema)).toBe(false);
  });

  it("returns true when repetition carries a non-once scheme", () => {
    const schema = schemaDraft({
      repetition: { kind: "count", count: 5 },
      rows: oneRow(),
    });

    expect(shouldBeContainer(schema)).toBe(true);
  });

  it("returns true when it holds more than one row", () => {
    expect(shouldBeContainer(schemaDraft({ rows: twoRows() }))).toBe(true);
  });
});
