import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import type { ComposeContainer, ComposeNode, RepetitionAxis } from "../compose-tree.types";
import { asNodeId } from "../lib/id-factory";
import { makeRow } from "../lib/make-row";

import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeContainerCard } from "./compose-container-card";

const CADENCE_ROUNDS = 2;
const ROW_COUNT = 3;
const MIN_1_OCCURRENCES = 2;
const MIN_2_OCCURRENCES = 1;

const noopHandlers: NodeHandlers = {
  selectedNodeId: null,
  isStructuralEditingAllowed: true,
  onSelect: vi.fn(),
  onDuplicateNode: vi.fn(),
  onDeleteNode: vi.fn(),
  onReorderChildren: vi.fn(),
  onAddContainer: vi.fn(),
  onAddRow: vi.fn(),
};

const containerWith = (repetition: RepetitionAxis, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("cadence-root"),
  header: "Cadence block",
  notes: null,
  repetition,
  children,
});

const exerciseRows = (count: number): ComposeNode[] =>
  Array.from({ length: count }, () => makeRow("EXERCISE"));

const nestedContainer = (children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("nested-container"),
  header: "Nested group",
  notes: null,
  children,
});

const renderContainer = (repetition: RepetitionAxis, children: ComposeNode[]) =>
  render(
    <ComposeContainerCard
      container={containerWith(repetition, children)}
      exerciseById={new Map<string, Exercise>()}
      handlers={noopHandlers}
      onRename={() => undefined}
    />,
  );

describe("the authoring canvas EMOM minute pill (T2-3)", () => {
  it("labels direct rows MIN n cycling by rounds for a cadence container", () => {
    renderContainer(
      { kind: "cadence", everyMin: 1, rounds: CADENCE_ROUNDS },
      exerciseRows(ROW_COUNT),
    );

    expect(screen.getAllByText("MIN 1")).toHaveLength(MIN_1_OCCURRENCES);
    expect(screen.getAllByText("MIN 2")).toHaveLength(MIN_2_OCCURRENCES);
  });

  it("renders no minute pill for a non-cadence container", () => {
    renderContainer({ kind: "count", count: ROW_COUNT }, exerciseRows(ROW_COUNT));

    expect(screen.queryByText(/^MIN /)).not.toBeInTheDocument();
  });

  it("does not bleed minute pills into a nested container's rows (QA-T23-3, schema boundary)", () => {
    renderContainer({ kind: "cadence", everyMin: 1, rounds: CADENCE_ROUNDS }, [
      nestedContainer(exerciseRows(ROW_COUNT)),
    ]);

    expect(screen.queryByText(/^MIN /)).not.toBeInTheDocument();
  });
});
