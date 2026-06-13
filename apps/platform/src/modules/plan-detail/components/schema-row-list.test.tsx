import { createElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: {
    row: SchemaRow;
    index: number;
    minuteLabel?: string | null;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
        "data-index": String(props.index),
        "data-minute-label": props.minuteLabel ?? "",
      },
      `schema-row-card:${props.row.id}`,
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
});

vi.mock("./row-editor-modal", () => ({
  RowEditorModal: (props: { mode: { kind: string; schemaId?: string } }) =>
    createElement(
      "div",
      {
        "data-testid": "row-editor-modal-mock",
        "data-mode-kind": props.mode.kind,
        "data-schema-id": props.mode.schemaId ?? "",
      },
      "row-editor-modal",
    ),
}));

const { SchemaRowList } = await import("./schema-row-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: "clp9z8x7w0000abcd1234row1",
  schemaId: SCHEMA_ID,
  order: 1,
  exerciseId: EXERCISE_ID,
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
  ...overrides,
});

const makeRowGroup = (overrides: Partial<RowGroup> = {}): RowGroup => ({
  id: "clp9z8x7w0000abcd1234grp1",
  schemaId: SCHEMA_ID,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const rowIdsOf = (container: HTMLElement): (string | null)[] =>
  Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]')).map((node) =>
    node.getAttribute("data-row-id"),
  );

const minuteLabelsOf = (container: HTMLElement): (string | null)[] =>
  Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]')).map((node) =>
    node.getAttribute("data-minute-label"),
  );

describe("SchemaRowList rendering", () => {
  it("renders each ungrouped row as a card", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12rn1r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12rn1r002", order: 2 });

    const { container } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
        rowGroups={[]}
      />,
    );

    expect(rowIdsOf(container)).toEqual([r1.id, r2.id]);
  });

  it("clusters grouped rows under a minimal row-group box labelled by the first note", () => {
    const group = makeRowGroup({ id: "clp9z8x7w0000abcd12gp1g001", notes: ["superset"] });
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12gp1r001", order: 1, rowGroupId: group.id });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12gp1r002", order: 2, rowGroupId: group.id });

    const { container, getByText } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
        rowGroups={[group]}
      />,
    );

    expect(getByText("superset")).toBeInTheDocument();
    expect(rowIdsOf(container)).toEqual([r1.id, r2.id]);
  });

  it("assigns a continuous row index across grouped and ungrouped rows", () => {
    const group = makeRowGroup({ id: "clp9z8x7w0000abcd12ix1g001" });
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12ix1r001", order: 1, rowGroupId: group.id });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12ix1r002", order: 2, rowGroupId: group.id });
    const r3 = makeRow({ id: "clp9z8x7w0000abcd12ix1r003", order: 3 });

    const { container } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2, r3]}
        rowGroups={[group]}
      />,
    );

    const indices = Array.from(
      container.querySelectorAll('[data-testid="schema-row-card-mock"]'),
    ).map((node) => node.getAttribute("data-index"));

    expect(indices).toEqual(["0", "1", "2"]);
  });
});

describe("SchemaRowList cadence minute labels", () => {
  it("cycles MIN labels across rows by the cadence round count", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12ca1r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12ca1r002", order: 2 });
    const r3 = makeRow({ id: "clp9z8x7w0000abcd12ca1r003", order: 3 });
    const composition: Composition = { repetition: { kind: "cadence", everyMin: 1, rounds: 2 } };

    const { container } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2, r3]}
        rowGroups={[]}
        composition={composition}
      />,
    );

    expect(minuteLabelsOf(container)).toEqual(["MIN 1", "MIN 2", "MIN 1"]);
  });

  it("assigns no minute label when no composition is supplied", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12nc1r001", order: 1 });

    const { container } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1]}
        rowGroups={[]}
      />,
    );

    expect(minuteLabelsOf(container)).toEqual([""]);
  });
});

describe("SchemaRowList add row", () => {
  const renderList = () =>
    render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[]}
        rowGroups={[]}
      />,
    );

  it("renders the Add row button enabled and tagged with the schema id", () => {
    renderList();

    const addButton = screen.getByRole("button", { name: /add row/i });

    expect(addButton).toBeEnabled();
    expect(addButton).toHaveAttribute("data-schema-id", SCHEMA_ID);
  });

  it("opens the row editor modal in create mode for the schema when Add row is clicked", () => {
    renderList();

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /add row/i }));

    const modal = screen.getByTestId("row-editor-modal-mock");

    expect(modal).toHaveAttribute("data-mode-kind", "create");
    expect(modal).toHaveAttribute("data-schema-id", SCHEMA_ID);
  });
});
