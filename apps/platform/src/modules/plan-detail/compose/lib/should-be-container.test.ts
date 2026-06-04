import { describe, expect, it } from "vitest";

import type { ComposeContainer, ComposeNode, ComposeRow } from "../compose-tree.types";

import { asNodeId } from "./id-factory";
import { makeRow } from "./make-row";
import { shouldBeContainer } from "./should-be-container";

const baseContainer = (overrides: Partial<ComposeContainer>): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("predicate-container"),
  header: null,
  notes: null,
  children: [],
  ...overrides,
});

const oneChild = (): ComposeNode[] => [makeRow("REST_SLOT")];
const twoChildren = (): ComposeNode[] => [makeRow("REST_SLOT"), makeRow("REST_SLOT")];

describe("shouldBeContainer", () => {
  it("returns false for a row node", () => {
    const row: ComposeRow = makeRow("EXERCISE");

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
