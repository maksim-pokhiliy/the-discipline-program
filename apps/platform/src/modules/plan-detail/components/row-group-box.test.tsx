import { createElement } from "react";

import { describe, expect, it, vi } from "vitest";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: { row: SchemaRow; index: number }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
        "data-index": String(props.index),
      },
      `schema-row-card:${props.row.id}`,
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
});

const { RowGroupBox } = await import("./row-group-box");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeGroup = (overrides: Partial<RowGroup> = {}): RowGroup => ({
  id: "clp9z8x7w0000abcd1234grp1",
  schemaId: SCHEMA_ID,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeRow = (id: string, order: number): SchemaRow => ({
  id,
  schemaId: SCHEMA_ID,
  order,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: "clp9z8x7w0000abcd1234grp1",
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const renderBox = (group: RowGroup, members: SchemaRow[]) =>
  render(
    <RowGroupBox
      group={group}
      members={members}
      planId={PLAN_ID}
      startDate={START_DATE}
      startIndex={0}
      isReorderPending={false}
    />,
  );

describe("RowGroupBox label", () => {
  it("uses the first note as the box label (QA-#16)", () => {
    const { getByText } = renderBox(makeGroup({ notes: ["OR"] }), [makeRow("r1", 1)]);

    expect(getByText("OR")).toBeInTheDocument();
  });

  it("falls back to GROUP when notes is null (QA-#16)", () => {
    const { getByText } = renderBox(makeGroup({ notes: null }), [makeRow("r1", 1)]);

    expect(getByText("GROUP")).toBeInTheDocument();
  });

  it("falls back to GROUP when notes is an empty list (QA-#16)", () => {
    const { getByText } = renderBox(makeGroup({ notes: [] }), [makeRow("r1", 1)]);

    expect(getByText("GROUP")).toBeInTheDocument();
  });
});

describe("RowGroupBox members", () => {
  it("renders each member card with a continuous index from startIndex (QA-#16)", () => {
    const { container } = renderBox(makeGroup(), [makeRow("m1", 1), makeRow("m2", 2)]);

    const cards = Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]'));

    expect(cards.map((c) => c.getAttribute("data-row-id"))).toEqual(["m1", "m2"]);
    expect(cards.map((c) => c.getAttribute("data-index"))).toEqual(["0", "1"]);
  });
});
