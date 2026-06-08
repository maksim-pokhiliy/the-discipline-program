import { describe, expect, it } from "vitest";

import type {
  ComposeContainer,
  ComposeNode,
  ComposeRow,
} from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import { shouldBeContainer } from "./should-be-container";

let rowCounter = 0;

const makeRestSlotRow = (): ComposeRow => {
  rowCounter += 1;

  return {
    nodeType: "row",
    id: asNodeId(`predicate-row-${String(rowCounter)}`),
    rowKind: "REST_SLOT",
    rowPayload: { rowKind: "REST_SLOT" },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
    editorDraft: undefined,
  };
};

const baseContainer = (overrides: Partial<ComposeContainer>): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("predicate-container"),
  header: null,
  notes: null,
  children: [],
  ...overrides,
});

const oneChild = (): ComposeNode[] => [makeRestSlotRow()];
const twoChildren = (): ComposeNode[] => [makeRestSlotRow(), makeRestSlotRow()];

describe("shouldBeContainer", () => {
  it("returns false for a row node", () => {
    const row: ComposeRow = makeRestSlotRow();

    expect(shouldBeContainer(row)).toBe(false);
  });

  it("returns false for a bare single-child container with no axes", () => {
    expect(shouldBeContainer(baseContainer({ children: oneChild() }))).toBe(false);
  });

  it("returns false for an empty container with once/ordered/prescribed axes", () => {
    const container = baseContainer({
      repetition: { kind: "once" },
      arrangement: { kind: "ordered" },
      scoring: { kind: "prescribed" },
    });

    expect(shouldBeContainer(container)).toBe(false);
  });

  it("returns true when repetition carries a non-once scheme", () => {
    const container = baseContainer({
      repetition: { kind: "count", count: 5 },
      children: oneChild(),
    });

    expect(shouldBeContainer(container)).toBe(true);
  });

  it("returns true when arrangement is non-ordered", () => {
    const container = baseContainer({
      arrangement: { kind: "parallel", interleaveOrder: "round_by_round", tracks: [] },
      children: oneChild(),
    });

    expect(shouldBeContainer(container)).toBe(true);
  });

  it("returns true when scoring is non-prescribed", () => {
    const container = baseContainer({ scoring: { kind: "amrap" }, children: oneChild() });

    expect(shouldBeContainer(container)).toBe(true);
  });

  it("returns true when it holds more than one child", () => {
    expect(shouldBeContainer(baseContainer({ children: twoChildren() }))).toBe(true);
  });
});
