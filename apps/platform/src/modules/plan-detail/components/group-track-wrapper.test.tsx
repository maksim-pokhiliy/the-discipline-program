import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateSchemaState = { isPending: false };
const deleteSchemaState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSchema: () => ({ mutate: vi.fn(), isPending: updateSchemaState.isPending }),
    useDeleteSchema: () => ({ mutate: vi.fn(), isPending: deleteSchemaState.isPending }),
  };
});

vi.mock("./schema-row-list", () => ({
  SchemaRowList: () => <div data-testid="schema-row-list-mock" />,
}));

const { GroupTrackWrapper } = await import("./group-track-wrapper");
const { SchemaCard } = await import("./schema-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const DRAG_HANDLE_ARIA = "Drag schema";
const SELECT_CHECKBOX_ARIA = "Select schema";

const makeMember = (id: string): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: GROUP_ID,
    order: 1,
    header: null,
    intensity: null,
    composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  rowGroups: [],
});

const renderWrapper = (member: SchemaWithBody = makeMember("clp9z8x7w0000abcd1234mm01")): void => {
  render(
    <GroupTrackWrapper
      member={member}
      planId={PLAN_ID}
      startDate={START_DATE}
      parentIsReorderPending={false}
    />,
  );
};

afterEach(() => {
  updateSchemaState.isPending = false;
  deleteSchemaState.isPending = false;
});

describe("GroupTrackWrapper flush member (DR-W4E-SG-WRAP rail + badge stripped)", () => {
  it("renders no track-ordinal badge", () => {
    renderWrapper();

    expect(screen.queryByLabelText(/^Track \d+$/)).toBeNull();
  });

  it("renders the member SchemaCard body", () => {
    renderWrapper();

    expect(screen.getByTestId("schema-row-list-mock")).toBeInTheDocument();
  });
});

describe("GroupTrackWrapper member card is draggable in-group (DR-W4E-INGROUP-REORDER)", () => {
  it("renders the boxed member SchemaCard WITH the 'Drag schema' handle for in-group reorder", () => {
    renderWrapper();

    expect(screen.getByRole("button", { name: DRAG_HANDLE_ARIA })).toBeInTheDocument();
  });

  it("keeps the 'Drag schema' handle on a standalone SchemaCard", () => {
    render(
      <SchemaCard
        schema={makeMember("clp9z8x7w0000abcd1234mm09")}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.getByRole("button", { name: DRAG_HANDLE_ARIA })).toBeInTheDocument();
  });
});

describe("group member is structurally unselectable in select-mode (W4R-001-CLIENT)", () => {
  it("renders NO select checkbox on a boxed member even though GroupTrackWrapper accepts no select props", () => {
    renderWrapper();

    expect(screen.queryByRole("checkbox", { name: SELECT_CHECKBOX_ARIA })).toBeNull();
  });

  it("renders the select checkbox on a standalone SchemaCard when select-mode is active", () => {
    render(
      <SchemaCard
        schema={makeMember("clp9z8x7w0000abcd1234mm11")}
        planId={PLAN_ID}
        startDate={START_DATE}
        isSelectMode
      />,
    );

    expect(screen.getByRole("checkbox", { name: SELECT_CHECKBOX_ARIA })).toBeInTheDocument();
  });

  it("renders NO select checkbox on a standalone SchemaCard outside select-mode", () => {
    render(
      <SchemaCard
        schema={makeMember("clp9z8x7w0000abcd1234mm12")}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.queryByRole("checkbox", { name: SELECT_CHECKBOX_ARIA })).toBeNull();
  });
});
