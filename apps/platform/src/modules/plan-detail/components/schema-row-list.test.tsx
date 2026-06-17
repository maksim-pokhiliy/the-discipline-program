import { createElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type {
  CreateRowGroupRequest,
  CreateRowGroupResponse,
  RowGroup,
} from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { exerciseById } from "./schema-row-card.fixtures";

const createRowGroupMock =
  vi.fn<(planId: string, data: CreateRowGroupRequest) => Promise<CreateRowGroupResponse>>();
const toastErrorMock = vi.fn<(message: string) => void>();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", () => ({
  api: {
    rowGroups: {
      create: (planId: string, data: CreateRowGroupRequest) => createRowGroupMock(planId, data),
    },
  },
}));

vi.mock("@app/lib/hooks", () => ({
  useReorderSchemaRows: () => ({ mutate: vi.fn(), isPending: false }),
  useCatalog: () => ({ exerciseById }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
    success: (message: string) => toastSuccessMock(message),
  },
}));

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: {
    row: SchemaRow;
    index: number;
    minuteLabel?: string | null;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (rowId: string) => void;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
        "data-index": String(props.index),
        "data-minute-label": props.minuteLabel ?? "",
        "data-select-mode": props.isSelectMode ? "true" : "false",
        "data-selected": props.isSelected ? "true" : "false",
      },
      createElement(
        "button",
        {
          type: "button",
          "data-testid": "row-select-toggle",
          "data-row-id": props.row.id,
          onClick: () => props.onToggleSelect?.(props.row.id),
        },
        `toggle:${props.row.id}`,
      ),
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
});

vi.mock("./row-group-box", () => {
  const renderRowGroupBoxMock = (props: { group: RowGroup }) =>
    createElement(
      "div",
      { "data-testid": "row-group-box-mock", "data-group-id": props.group.id },
      "row-group-box",
    );

  return { RowGroupBox: renderRowGroupBoxMock };
});

vi.mock("./row-editor-modal", () => {
  const renderRowEditorModalMock = (props: { mode: { kind: string; schemaId?: string } }) =>
    createElement(
      "div",
      {
        "data-testid": "row-editor-modal-mock",
        "data-mode-kind": props.mode.kind,
        "data-schema-id": props.mode.schemaId ?? "",
      },
      "row-editor-modal",
    );

  return { RowEditorModal: renderRowEditorModalMock };
});

const { SchemaRowList } = await import("./schema-row-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const R1 = "clp9z8x7w0000abcd12rl1r001";
const R2 = "clp9z8x7w0000abcd12rl1r002";
const R3 = "clp9z8x7w0000abcd12rl1r003";

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: R1,
  schemaId: SCHEMA_ID,
  order: 1,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  intensity: null,
  rest: null,
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

const rowGroupResponse = (): CreateRowGroupResponse => ({
  group: makeRowGroup(),
  members: [],
});

const renderList = (
  rows: SchemaRow[],
  rowGroups: RowGroup[] = [],
  composition: Composition | null = null,
) => {
  const queryClient = new QueryClient();

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(SchemaRowList, {
        planId: PLAN_ID,
        startDate: START_DATE,
        schemaId: SCHEMA_ID,
        rows,
        rowGroups,
        composition,
      }),
    ),
  );
};

const rowIdsOf = (container: HTMLElement): (string | null)[] =>
  Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]')).map((node) =>
    node.getAttribute("data-row-id"),
  );

const toggleButtonFor = (rowId: string): HTMLElement => {
  const cards = Array.from(screen.getAllByTestId("schema-row-card-mock"));
  const card = cards.find((node) => node.getAttribute("data-row-id") === rowId);

  if (card === undefined) {
    throw new Error(`no card for ${rowId}`);
  }

  return within(card).getByTestId("row-select-toggle");
};

beforeEach(() => {
  createRowGroupMock.mockReset();
  toastErrorMock.mockReset();
  toastSuccessMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SchemaRowList rendering", () => {
  it("renders each ungrouped row as a card", () => {
    const r1 = makeRow({ id: R1, order: 1 });
    const r2 = makeRow({ id: R2, order: 2 });

    const { container } = renderList([r1, r2]);

    expect(rowIdsOf(container)).toEqual([R1, R2]);
  });

  it("assigns a continuous row index across grouped and ungrouped rows", () => {
    const group = makeRowGroup({ id: "clp9z8x7w0000abcd12ix1g001" });
    const r1 = makeRow({ id: R1, order: 1, rowGroupId: group.id });
    const r2 = makeRow({ id: R2, order: 2 });

    const { container } = renderList([r1, r2], [group]);

    expect(screen.getByTestId("row-group-box-mock")).toBeInTheDocument();
    expect(rowIdsOf(container)).toEqual([R2]);
  });
});

describe("SchemaRowList cadence minute labels", () => {
  it("cycles MIN labels across rows by the cadence round count", () => {
    const r1 = makeRow({ id: R1, order: 1 });
    const r2 = makeRow({ id: R2, order: 2 });
    const r3 = makeRow({ id: R3, order: 3 });
    const composition: Composition = { repetition: { kind: "cadence", everyMin: 1, rounds: 2 } };

    renderList([r1, r2, r3], [], composition);

    const labels = Array.from(screen.getAllByTestId("schema-row-card-mock")).map((node) =>
      node.getAttribute("data-minute-label"),
    );

    expect(labels).toEqual(["MIN 1", "MIN 2", "MIN 1"]);
  });
});

describe("SchemaRowList add row", () => {
  it("renders the Add row button enabled and tagged with the schema id", () => {
    renderList([]);

    const addButton = screen.getByRole("button", { name: /add row/i });

    expect(addButton).toBeEnabled();
    expect(addButton).toHaveAttribute("data-schema-id", SCHEMA_ID);
  });

  it("opens the row editor modal in create mode for the schema when Add row is clicked", () => {
    renderList([]);

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /add row/i }));

    const modal = screen.getByTestId("row-editor-modal-mock");

    expect(modal).toHaveAttribute("data-mode-kind", "create");
    expect(modal).toHaveAttribute("data-schema-id", SCHEMA_ID);
  });
});

describe("SchemaRowList group-rows gesture", () => {
  it("hides the Group rows affordance when fewer than two ungrouped rows exist", () => {
    renderList([makeRow({ id: R1, order: 1 })]);

    expect(screen.queryByRole("button", { name: /group rows/i })).toBeNull();
  });

  it("does not count grouped rows toward the two-ungrouped threshold", () => {
    const group = makeRowGroup();
    const r1 = makeRow({ id: R1, order: 1, rowGroupId: group.id });
    const r2 = makeRow({ id: R2, order: 2 });

    renderList([r1, r2], [group]);

    expect(screen.queryByRole("button", { name: /group rows/i })).toBeNull();
  });

  it("shows the Group rows affordance when at least two ungrouped rows exist", () => {
    renderList([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    expect(screen.getByRole("button", { name: /group rows/i })).toBeInTheDocument();
  });

  it("enters select mode and renders the bottom bar with the Group rows confirm disabled until two are selected", () => {
    renderList([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));

    const cards = screen.getAllByTestId("schema-row-card-mock");

    expect(cards.every((node) => node.getAttribute("data-select-mode") === "true")).toBe(true);

    const confirm = screen.getByRole("button", { name: /^group rows$/i });

    expect(confirm).toBeDisabled();

    fireEvent.click(toggleButtonFor(R1));

    expect(confirm).toBeDisabled();

    fireEvent.click(toggleButtonFor(R2));

    expect(confirm).toBeEnabled();
  });

  it("fires one create request with the contiguous selection sorted by order", async () => {
    createRowGroupMock.mockResolvedValueOnce(rowGroupResponse());

    renderList([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    fireEvent.click(toggleButtonFor(R2));
    fireEvent.click(toggleButtonFor(R1));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    });

    expect(createRowGroupMock).toHaveBeenCalledTimes(1);
    expect(createRowGroupMock).toHaveBeenCalledWith(PLAN_ID, {
      schemaId: SCHEMA_ID,
      rowIds: [R1, R2],
      notes: null,
    });
  });

  it("surfaces a coach message and never hits the network for a non-contiguous selection", async () => {
    renderList([
      makeRow({ id: R1, order: 1 }),
      makeRow({ id: R2, order: 2 }),
      makeRow({ id: R3, order: 3 }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    fireEvent.click(toggleButtonFor(R1));
    fireEvent.click(toggleButtonFor(R3));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    });

    expect(createRowGroupMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith("Selected rows must be next to each other");
  });

  it("runs the create once on a synchronous double-fire of the Group rows confirm", async () => {
    let resolveRequest: ((response: CreateRowGroupResponse) => void) | undefined;
    const pending = new Promise<CreateRowGroupResponse>((resolve) => {
      resolveRequest = resolve;
    });

    createRowGroupMock.mockReturnValueOnce(pending);

    renderList([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    fireEvent.click(toggleButtonFor(R1));
    fireEvent.click(toggleButtonFor(R2));

    const confirm = screen.getByRole("button", { name: /^group rows$/i });

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });

    expect(createRowGroupMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.(rowGroupResponse());
      await pending;
    });
  });

  it("cancels select mode without firing a request", () => {
    renderList([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    fireEvent.click(screen.getByRole("button", { name: /^group rows$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();
    expect(createRowGroupMock).not.toHaveBeenCalled();
  });
});
