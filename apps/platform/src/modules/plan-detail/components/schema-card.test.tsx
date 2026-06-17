import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Intensity } from "@repo/contracts/lms/_shared";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateSchemaMutate = vi.fn();
const deleteSchemaMutate = vi.fn();
const createSchemaMutate = vi.fn();
const updateSchemaState = { isPending: false };
const deleteSchemaState = { isPending: false };
const createSchemaState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCatalog: () => ({ exerciseById: new Map() }),
    useCreateSchema: () => ({
      mutate: createSchemaMutate,
      isPending: createSchemaState.isPending,
    }),
    useUpdateSchema: () => ({
      mutate: updateSchemaMutate,
      isPending: updateSchemaState.isPending,
    }),
    useDeleteSchema: () => ({
      mutate: deleteSchemaMutate,
      isPending: deleteSchemaState.isPending,
    }),
  };
});

vi.mock("./schema-row-list", () => {
  const renderRowListMock = (props: {
    rows: SchemaWithBody["rows"];
    schemaId: string;
    planId: string;
    startDate: string;
    parentIsReorderPending?: boolean;
  }) => (
    <div
      data-testid="schema-row-list-mock"
      data-rows={String(props.rows.length)}
      data-schema-id={props.schemaId}
      data-plan-id={props.planId}
      data-start-date={props.startDate}
      data-parent-pending={props.parentIsReorderPending === true ? "true" : "false"}
    >
      {`row-list:${String(props.rows.length)}`}
    </div>
  );

  return { SchemaRowList: renderRowListMock };
});

const { SchemaCard } = await import("./schema-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const DRAG_LABEL = "Drag schema";
const DELETE_LABEL = "Delete schema";
const TITLE_LABEL = "Schema title";
const EDIT_LABEL = "Edit axes";

const COUNT_5: SchemaWithBody["schema"]["composition"] = {
  repetition: { kind: "count", count: 5 },
};

type MakeSchemaOverrides = Partial<SchemaWithBody["schema"]> & {
  rows?: SchemaWithBody["rows"];
};

const makeSchema = (overrides: MakeSchemaOverrides = {}): SchemaWithBody => {
  const { rows, ...schemaOverrides } = overrides;

  return {
    schema: {
      id: SCHEMA_ID,
      blockId: BLOCK_ID,
      groupId: null,
      order: 1,
      header: null,
      intensity: null,
      composition: COUNT_5,
      label: null,
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...schemaOverrides,
    },
    rows: rows ?? [],
    rowGroups: [],
  };
};

type RenderOptions = {
  schema?: SchemaWithBody;
  parentIsReorderPending?: boolean;
  isBoxed?: boolean;
};

const renderSchemaCard = ({
  schema = makeSchema(),
  parentIsReorderPending = false,
  isBoxed = false,
}: RenderOptions = {}) =>
  render(
    <SchemaCard
      schema={schema}
      planId={PLAN_ID}
      startDate={START_DATE}
      parentIsReorderPending={parentIsReorderPending}
      isBoxed={isBoxed}
    />,
  );

afterEach(() => {
  updateSchemaState.isPending = false;
  deleteSchemaState.isPending = false;
  createSchemaState.isPending = false;
  updateSchemaMutate.mockReset();
  deleteSchemaMutate.mockReset();
  createSchemaMutate.mockReset();
});

describe("SchemaCard chrome", () => {
  it("renders the outer Stack as a column flex container", () => {
    const { container } = renderSchemaCard();
    const shell = container.querySelector(".MuiStack-root");

    expect(shell).not.toBeNull();
    expect(shell).toHaveStyle({ flexDirection: "column" });
  });

  it("renders head then body in the documented order with no nested schema list (leaf)", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: "Expand schema" }));

    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });
    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });
    const rowListMock = screen.getByTestId("schema-row-list-mock");

    const sectionOrder = [dragBtn, titleInput, rowListMock];

    for (let i = 0; i < sectionOrder.length - 1; i += 1) {
      const earlier = sectionOrder[i];
      const later = sectionOrder[i + 1];

      if (earlier === undefined || later === undefined) {
        throw new Error("section reference missing");
      }

      expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    }
  });
});

describe("SchemaCard drag handle", () => {
  it("renders an IconButton with aria 'Drag schema', grab cursor and touchAction:none", () => {
    renderSchemaCard();

    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });

    expect(dragBtn).toBeInTheDocument();
    expect(dragBtn).toHaveStyle({ cursor: "grab", touchAction: "none" });
  });

  it("renders the drag handle for a grouped member schema (groupId non-null)", () => {
    renderSchemaCard({ schema: makeSchema({ groupId: GROUP_ID }), isBoxed: true });

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeInTheDocument();
  });

  it("disables the drag handle when useUpdateSchema is pending", () => {
    updateSchemaState.isPending = true;

    renderSchemaCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
  });

  it("disables the drag handle when useDeleteSchema is pending", () => {
    deleteSchemaState.isPending = true;

    renderSchemaCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
  });
});

describe("SchemaCard composition tag", () => {
  it("renders the full repetition label in the tag for a count composition", () => {
    renderSchemaCard();

    expect(screen.getByText("5 rounds")).toBeInTheDocument();
  });

  it("renders the full ladder label in the tag for a ladder composition", () => {
    renderSchemaCard({
      schema: makeSchema({ composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } } }),
    });

    expect(screen.getByText("ladder 21-15-9")).toBeInTheDocument();
  });

  it("renders no composition-kind tag when composition is null", () => {
    renderSchemaCard({ schema: makeSchema({ composition: null }) });

    expect(screen.queryByText("rounds")).toBeNull();
    expect(screen.queryByText("flat")).toBeNull();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });

  it("renders the title row and its composition tag when isBoxed (header parity, D7/D-HEADER-KEEP supersedes DR-W1-3)", () => {
    renderSchemaCard({
      schema: makeSchema({ composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } } }),
      isBoxed: true,
    });

    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
    expect(screen.getByText("ladder 21-15-9")).toBeInTheDocument();
  });
});

describe("SchemaCard title", () => {
  it("leaves the title empty (no auto-derived header) when schema.header is null", () => {
    renderSchemaCard();

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    if (!(titleInput instanceof HTMLInputElement)) {
      throw new Error("title input not an HTMLInputElement");
    }

    expect(titleInput.value).toBe("");
  });

  it("renders the schema.header verbatim when set to a non-empty string", () => {
    renderSchemaCard({ schema: makeSchema({ header: "Custom EMOM heading" }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    if (!(titleInput instanceof HTMLInputElement)) {
      throw new Error("title input not an HTMLInputElement");
    }

    expect(titleInput.value).toBe("Custom EMOM heading");
  });

  it("commits a non-empty value as { header: <value> } via useUpdateSchema.mutate", () => {
    renderSchemaCard();

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    fireEvent.focus(titleInput);
    fireEvent.change(titleInput, { target: { value: "Renamed schema" } });
    fireEvent.blur(titleInput);

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate).toHaveBeenCalledWith({
      schemaId: SCHEMA_ID,
      data: { header: "Renamed schema" },
    });
  });

  it("commits an empty string as { header: null } via useUpdateSchema.mutate", () => {
    renderSchemaCard({ schema: makeSchema({ header: "Previous header" }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    fireEvent.focus(titleInput);
    fireEvent.change(titleInput, { target: { value: "" } });
    fireEvent.blur(titleInput);

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate).toHaveBeenCalledWith({
      schemaId: SCHEMA_ID,
      data: { header: null },
    });
  });

  it("does NOT fire mutate on focus+blur of a whitespace-only header without typing (MT-1 + QA-001)", () => {
    renderSchemaCard({ schema: makeSchema({ header: "   " }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    fireEvent.focus(titleInput);
    fireEvent.blur(titleInput);

    expect(updateSchemaMutate).not.toHaveBeenCalled();
  });

  it("trims whitespace padding before committing a non-empty value (MT-2 + QA-001)", () => {
    renderSchemaCard({ schema: makeSchema({ header: "old" }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    fireEvent.focus(titleInput);
    fireEvent.change(titleInput, { target: { value: "  new title  " } });
    fireEvent.blur(titleInput);

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate).toHaveBeenCalledWith({
      schemaId: SCHEMA_ID,
      data: { header: "new title" },
    });
  });

  it("does NOT fire mutate when committed value equals current header (MT-3 + QA-001 idempotence)", () => {
    renderSchemaCard({ schema: makeSchema({ header: "current" }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    fireEvent.focus(titleInput);
    fireEvent.change(titleInput, { target: { value: "current" } });
    fireEvent.blur(titleInput);

    expect(updateSchemaMutate).not.toHaveBeenCalled();
  });

  it("reverts the draft and does NOT fire mutate when Escape is pressed (MT-8)", () => {
    renderSchemaCard({ schema: makeSchema({ header: "original" }) });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    if (!(titleInput instanceof HTMLInputElement)) {
      throw new Error("title input not an HTMLInputElement");
    }

    fireEvent.focus(titleInput);
    fireEvent.change(titleInput, { target: { value: "changed" } });
    fireEvent.keyDown(titleInput, { key: "Escape" });

    expect(titleInput.value).toBe("original");
    expect(updateSchemaMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaCard meta row", () => {
  it("does not duplicate the composition summary below the tag (the chip carries it)", () => {
    renderSchemaCard();

    expect(screen.getAllByText("5 rounds")).toHaveLength(1);
  });

  it("renders the rest summary in the meta row when the composition carries rest", () => {
    renderSchemaCard({
      schema: makeSchema({
        composition: {
          repetition: { kind: "count", count: 5 },
          rest: {
            duration: { value: 90, unit: "range_sec", rangeMax: 120 },
            scope: "between_rounds",
          },
        },
      }),
    });

    expect(screen.getByText("rest 90–120 s between rounds")).toBeInTheDocument();
  });

  it("renders an own IndicatorChip when schema.intensity is set (dot=false filled-pill)", () => {
    const schemaIntensity: Intensity = { effortPercent: { value: 80 } };

    const { container } = renderSchemaCard({
      schema: makeSchema({ intensity: schemaIntensity }),
    });

    const ownChip = screen.getByText("EFFORT 80%");
    const ownChipRoot = ownChip.closest(".MuiChip-root");

    expect(ownChipRoot).not.toBeNull();
    expect(ownChipRoot).toHaveClass("MuiChip-colorPrimary");

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it("renders no 'no params' filler when the composition and intensity are both empty", () => {
    renderSchemaCard({ schema: makeSchema({ composition: {} }) });

    expect(screen.queryByText("no params")).toBeNull();
  });
});

describe("SchemaCard delete action", () => {
  it("opens the ConfirmationModal when the Delete IconButton is clicked, then fires useDeleteSchema.mutate on confirm", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));

    expect(screen.getByRole("heading", { name: "Delete schema" })).toBeInTheDocument();
    expect(screen.getByText("Delete this schema?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaMutate.mock.calls[0]?.[0]).toEqual({ schemaId: SCHEMA_ID });
  });

  it("passes the derived composition header as the ConfirmationModal details copy", () => {
    renderSchemaCard({
      schema: makeSchema({
        composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 12 } },
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("EMOM 1’×12")).toBeInTheDocument();
  });

  it("fires useDeleteSchema.mutate on confirm for a grouped member (groupId non-null)", () => {
    renderSchemaCard({
      schema: makeSchema({ id: SCHEMA_ID, groupId: GROUP_ID }),
      isBoxed: true,
    });

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaMutate.mock.calls[0]?.[0]).toEqual({ schemaId: SCHEMA_ID });
  });

  it("disables the Delete IconButton when useDeleteSchema is pending", () => {
    deleteSchemaState.isPending = true;

    renderSchemaCard();

    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeDisabled();
  });
});

describe("SchemaCard edit-axes affordance", () => {
  it("enables the Edit axes IconButton", () => {
    renderSchemaCard();

    expect(screen.getByRole("button", { name: EDIT_LABEL })).toBeEnabled();
  });

  it("opens the edit AxisEditorModal (title 'Edit schema') when Edit axes is clicked", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: EDIT_LABEL }));

    expect(screen.getByRole("dialog", { name: "Edit schema" })).toBeInTheDocument();
  });
});

describe("SchemaCard body / SchemaRowList wiring", () => {
  it("renders SchemaRowList with rows, schemaId, planId and startDate from props", () => {
    const row: SchemaWithBody["rows"][number] = {
      id: "clp9z8x7w0000abcd1234row1",
      schemaId: SCHEMA_ID,
      order: 1,
      exerciseId: "clp9z8x7w0000abcd1234exe1",
      sets: null,
      rowGroupId: null,
      load: null,
      reps: null,
      side: null,
      tempo: null,
      media: null,
      intensity: null,
      rest: null,
      modifiers: [],
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    };

    renderSchemaCard({ schema: makeSchema({ rows: [row] }) });

    fireEvent.click(screen.getByRole("button", { name: "Expand schema" }));

    const rowListMock = screen.getByTestId("schema-row-list-mock");

    expect(rowListMock).toHaveAttribute("data-rows", "1");
    expect(rowListMock).toHaveAttribute("data-schema-id", SCHEMA_ID);
    expect(rowListMock).toHaveAttribute("data-plan-id", PLAN_ID);
    expect(rowListMock).toHaveAttribute("data-start-date", START_DATE);
  });
});

describe("SchemaCard parentIsReorderPending cascade (D-10)", () => {
  it("defaults parentIsReorderPending to false when prop is omitted", () => {
    renderSchemaCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).not.toBeDisabled();
  });

  it("disables the drag handle when parentIsReorderPending is true", () => {
    renderSchemaCard({ parentIsReorderPending: true });

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
  });

  it("disables the Delete IconButton when parentIsReorderPending is true", () => {
    renderSchemaCard({ parentIsReorderPending: true });

    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeDisabled();
  });

  it("passes effective pending down to SchemaRowList when parentIsReorderPending is true", () => {
    renderSchemaCard({ parentIsReorderPending: true });

    fireEvent.click(screen.getByRole("button", { name: "Expand schema" }));

    expect(screen.getByTestId("schema-row-list-mock")).toHaveAttribute(
      "data-parent-pending",
      "true",
    );
  });

  it("passes data-parent-pending='false' to SchemaRowList when parentIsReorderPending is false", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: "Expand schema" }));

    expect(screen.getByTestId("schema-row-list-mock")).toHaveAttribute(
      "data-parent-pending",
      "false",
    );
  });
});

describe("SchemaCard collapse (Session/Block parity)", () => {
  it("is collapsed by default — shows the SchemaRowList only after expanding, then hides it on collapse", () => {
    renderSchemaCard();

    expect(screen.queryByTestId("schema-row-list-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Expand schema" }));

    expect(screen.getByTestId("schema-row-list-mock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse schema" }));

    expect(screen.queryByTestId("schema-row-list-mock")).toBeNull();
  });

  it("keeps the title and composition tag visible while collapsed (head parity)", () => {
    renderSchemaCard();

    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
    expect(screen.getByText("5 rounds")).toBeInTheDocument();
  });
});
