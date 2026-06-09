import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Intensity, TimeCap } from "@repo/contracts/lms/_shared";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { BlockCtx } from "../lib/build-cascade-chips";

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
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-list-mock",
        "data-rows": String(props.rows.length),
        "data-schema-id": props.schemaId,
        "data-plan-id": props.planId,
        "data-start-date": props.startDate,
        "data-parent-pending": props.parentIsReorderPending === true ? "true" : "false",
      },
      `row-list:${String(props.rows.length)}`,
    );

  return { SchemaRowList: renderRowListMock };
});

vi.mock("./schema-list", () => {
  const renderSchemaListMock = (props: {
    schemas: SchemaWithBody[];
    parentSchemaId: string;
    parentIsReorderPending?: boolean;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-list-mock",
        "data-schemas-count": String(props.schemas.length),
        "data-parent-schema-id": props.parentSchemaId,
        "data-parent-pending": props.parentIsReorderPending === true ? "true" : "false",
      },
      `schema-list:${props.parentSchemaId}:${String(props.schemas.length)}`,
    );

  return { SchemaList: renderSchemaListMock };
});

const { SchemaCard } = await import("./schema-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const PARENT_SCHEMA_ID = "clp9z8x7w0000abcd1234psc1";
const SUB_SCHEMA_ID_A = "clp9z8x7w0000abcd1234ssa1";
const SUB_SCHEMA_ID_B = "clp9z8x7w0000abcd1234ssb1";
const DRAG_LABEL = "Drag schema";
const DELETE_LABEL = "Delete schema";
const TITLE_LABEL = "Schema title";
const EDIT_LABEL = "Edit axes";
const ADD_SUB_LABEL = "Add sub-schema";

const COUNT_5: SchemaWithBody["schema"]["composition"] = {
  repetition: { kind: "count", count: 5 },
};

type MakeSchemaOverrides = Partial<SchemaWithBody["schema"]> & {
  rows?: SchemaWithBody["rows"];
  subSchemas?: SchemaWithBody[];
};

const makeSchema = (overrides: MakeSchemaOverrides = {}): SchemaWithBody => {
  const { rows, subSchemas, ...schemaOverrides } = overrides;

  return {
    schema: {
      id: SCHEMA_ID,
      blockId: BLOCK_ID,
      parentSchemaId: null,
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
    subSchemas: subSchemas ?? [],
  };
};

const makeBlockCtx = (overrides: Partial<BlockCtx> = {}): BlockCtx => ({
  intensity: null,
  timeCap: null,
  ...overrides,
});

type RenderOptions = {
  schema?: SchemaWithBody;
  blockCtx?: BlockCtx;
  parentIsReorderPending?: boolean;
};

const renderSchemaCard = ({
  schema = makeSchema(),
  blockCtx = makeBlockCtx(),
  parentIsReorderPending = false,
}: RenderOptions = {}) =>
  render(
    <SchemaCard
      schema={schema}
      planId={PLAN_ID}
      startDate={START_DATE}
      blockCtx={blockCtx}
      parentIsReorderPending={parentIsReorderPending}
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

  it("renders head, meta, body sections in the documented order (no sub-schemas)", () => {
    renderSchemaCard();

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

  it("renders sub-schema SchemaList BETWEEN head and body when subSchemas non-empty", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
    });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });
    const subSchemaList = screen.getByTestId("schema-list-mock");
    const parentRowList = screen.getByTestId("schema-row-list-mock");

    expect(
      titleInput.compareDocumentPosition(subSchemaList) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(
      subSchemaList.compareDocumentPosition(parentRowList) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });
});

describe("SchemaCard drag handle", () => {
  it("renders an IconButton with aria 'Drag schema', grab cursor and touchAction:none on a top-level schema", () => {
    renderSchemaCard();

    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });

    expect(dragBtn).toBeInTheDocument();
    expect(dragBtn).toHaveStyle({ cursor: "grab", touchAction: "none" });
  });

  it("DOES render the drag handle when schema.parentSchemaId is non-null (D-03 sub-schemas draggable)", () => {
    renderSchemaCard({
      schema: makeSchema({ parentSchemaId: PARENT_SCHEMA_ID }),
    });

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
  it("renders the derived composition-kind tag (rounds) for a count composition", () => {
    renderSchemaCard();

    expect(screen.getByText("rounds")).toBeInTheDocument();
  });

  it("renders the 'ladder' tag for a ladder composition", () => {
    renderSchemaCard({
      schema: makeSchema({ composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } } }),
    });

    expect(screen.getByText("ladder")).toBeInTheDocument();
  });

  it("renders the 'parallel' tag for a parallel arrangement composition", () => {
    renderSchemaCard({
      schema: makeSchema({
        composition: {
          arrangement: {
            kind: "parallel",
            interleaveOrder: "round_by_round",
            tracks: [{ childSchemaId: SUB_SCHEMA_ID_A }, { childSchemaId: SUB_SCHEMA_ID_B }],
          },
        },
      }),
    });

    expect(screen.getAllByText("parallel").length).toBeGreaterThanOrEqual(1);
  });

  it("renders no composition-kind tag when composition is null", () => {
    renderSchemaCard({ schema: makeSchema({ composition: null }) });

    expect(screen.queryByText("rounds")).toBeNull();
    expect(screen.queryByText("flat")).toBeNull();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });
});

describe("SchemaCard title", () => {
  it("renders the InlineEditText with the derived composition header when schema.header is null", () => {
    renderSchemaCard();

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    expect(titleInput).toBeInstanceOf(HTMLInputElement);

    if (!(titleInput instanceof HTMLInputElement)) {
      throw new Error("title input not an HTMLInputElement");
    }

    expect(titleInput.value).toBe("5 rounds");
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
  it("renders the composition summary text for a count composition", () => {
    renderSchemaCard();

    expect(screen.getByText("5 rounds")).toBeInTheDocument();
  });

  it("renders an own IndicatorChip when schema.intensity is set (dot=false filled-pill)", () => {
    const schemaIntensity: Intensity = { effortPercent: { value: 80 } };

    const { container } = renderSchemaCard({
      schema: makeSchema({ intensity: schemaIntensity }),
    });

    const ownChip = screen.getByText("@ 80%");
    const ownChipRoot = ownChip.closest(".MuiChip-root");

    expect(ownChipRoot).not.toBeNull();
    expect(ownChipRoot).toHaveClass("MuiChip-colorPrimary");

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it("renders a CascadeChip for a block dim NOT overridden by the schema (rpe cascades, effortPercent stays own)", () => {
    const schemaIntensity: Intensity = { effortPercent: { value: 75 } };
    const blockIntensity: Intensity = { effortPercent: { value: 60 }, rpe: { value: 8 } };

    renderSchemaCard({
      schema: makeSchema({ intensity: schemaIntensity }),
      blockCtx: makeBlockCtx({ intensity: blockIntensity }),
    });

    expect(screen.getByText("@ 75%")).toBeInTheDocument();
    expect(screen.getByText("RPE 8")).toBeInTheDocument();
  });

  it("renders multiple cascade chips when block has 3 dims and schema overrides none", () => {
    const blockIntensity: Intensity = {
      effortPercent: { value: 70 },
      rpe: { value: 7 },
      pace: "moderate",
    };

    renderSchemaCard({
      schema: makeSchema(),
      blockCtx: makeBlockCtx({ intensity: blockIntensity }),
    });

    expect(screen.getByText("@ 70%")).toBeInTheDocument();
    expect(screen.getByText("RPE 7")).toBeInTheDocument();
    expect(screen.getByText("pace · moderate")).toBeInTheDocument();
  });

  it("renders the cap cascade chip 'cap 5:00' when blockCtx.timeCap is set", () => {
    const timeCap: TimeCap = { min: 5, unit: "min" };

    renderSchemaCard({ blockCtx: makeBlockCtx({ timeCap }) });

    expect(screen.getByText("cap 5:00")).toBeInTheDocument();
  });

  it("does NOT render the cap cascade chip when blockCtx.timeCap is null", () => {
    renderSchemaCard({ blockCtx: makeBlockCtx({ timeCap: null }) });

    expect(screen.queryByText(/^cap /)).toBeNull();
  });

  it("renders the 'no params' italic fallback when the composition, intensity and cascade are all empty", () => {
    renderSchemaCard({ schema: makeSchema({ composition: {} }) });

    expect(screen.getByText("no params")).toBeInTheDocument();
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

  it("DOES render the Delete IconButton when schema.parentSchemaId is non-null (F5 — sub-schemas deletable)", () => {
    renderSchemaCard({
      schema: makeSchema({ parentSchemaId: PARENT_SCHEMA_ID }),
    });

    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeInTheDocument();
  });

  it("fires useDeleteSchema.mutate on confirm for a sub-schema (F5 — sub-schemas deletable)", () => {
    renderSchemaCard({
      schema: makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: PARENT_SCHEMA_ID }),
    });

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaMutate.mock.calls[0]?.[0]).toEqual({ schemaId: SUB_SCHEMA_ID_A });
  });

  it("disables the Delete IconButton when useDeleteSchema is pending", () => {
    deleteSchemaState.isPending = true;

    renderSchemaCard();

    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeDisabled();
  });
});

describe("SchemaCard edit-axes affordance", () => {
  it("enables the Edit axes IconButton for a top-level schema", () => {
    renderSchemaCard();

    expect(screen.getByRole("button", { name: EDIT_LABEL })).toBeEnabled();
  });

  it("renders the Edit axes IconButton for a sub-schema (F5 — sub-schemas tunable)", () => {
    renderSchemaCard({
      schema: makeSchema({ parentSchemaId: PARENT_SCHEMA_ID }),
    });

    expect(screen.getByRole("button", { name: EDIT_LABEL })).toBeEnabled();
  });

  it("opens the edit AxisEditorModal (title 'Container composition') when Edit axes is clicked on a sub-schema", () => {
    renderSchemaCard({
      schema: makeSchema({ parentSchemaId: PARENT_SCHEMA_ID }),
    });

    fireEvent.click(screen.getByRole("button", { name: EDIT_LABEL }));

    expect(screen.getByRole("dialog", { name: "Container composition" })).toBeInTheDocument();
  });
});

describe("SchemaCard add-sub-schema affordance (F5)", () => {
  it("renders the Add-sub-schema button on a card with zero sub-schemas", () => {
    renderSchemaCard({ schema: makeSchema({ subSchemas: [] }) });

    expect(screen.getByRole("button", { name: ADD_SUB_LABEL })).toBeInTheDocument();
  });

  it("renders the Add-sub-schema button on a card that already has sub-schemas", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
    });

    expect(screen.getByRole("button", { name: ADD_SUB_LABEL })).toBeInTheDocument();
  });

  it("opens the create AxisEditorModal (title 'Add schema') when Add-sub-schema is clicked", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: ADD_SUB_LABEL }));

    expect(screen.getByRole("dialog", { name: "Add schema" })).toBeInTheDocument();
  });

  it("submits createSchema carrying parentSchemaId (parent id) and the parent's blockId", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: ADD_SUB_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Count" }));
    fireEvent.click(screen.getByRole("button", { name: "Add schema" }));

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      parentSchemaId: SCHEMA_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      notes: null,
    });
  });
});

describe("SchemaCard sub-schemas", () => {
  it("renders a nested SchemaList (parentSchemaId = parent schema id) with schema.subSchemas when non-empty", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [
          makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID }),
          makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID }),
        ],
      }),
    });

    const subSchemaList = screen.getByTestId("schema-list-mock");

    expect(subSchemaList).toHaveAttribute("data-parent-schema-id", SCHEMA_ID);
    expect(subSchemaList).toHaveAttribute("data-schemas-count", "2");
  });

  it("renders the parent's drag handle and Delete IconButton exactly once when subSchemas non-empty (D-03 sub-schema drag lives inside nested SchemaList mock)", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
    });

    const dragHandles = screen.getAllByRole("button", { name: DRAG_LABEL });
    const deleteButtons = screen.getAllByRole("button", { name: DELETE_LABEL });

    expect(dragHandles).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("renders nothing for sub-schemas when schema.subSchemas is an empty array", () => {
    renderSchemaCard({ schema: makeSchema({ subSchemas: [] }) });

    const dragHandles = screen.getAllByRole("button", { name: DRAG_LABEL });
    const deleteButtons = screen.getAllByRole("button", { name: DELETE_LABEL });
    const rowLists = screen.getAllByTestId("schema-row-list-mock");

    expect(dragHandles).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
    expect(rowLists).toHaveLength(1);
    expect(screen.queryByTestId("schema-list-mock")).toBeNull();
  });

  it("renders the cap cascade chip on the parent meta row when blockCtx has a timeCap (sub-schema row lives inside nested SchemaList mock)", () => {
    const timeCap: TimeCap = { min: 10, unit: "min" };

    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [
          makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID }),
          makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID }),
        ],
      }),
      blockCtx: makeBlockCtx({ timeCap }),
    });

    expect(screen.getAllByText("cap 10:00")).toHaveLength(1);
  });

  it("renders without throwing when sub-schemas are pre-populated; SchemaList mock terminates recursion (MT-7 + QA-006)", () => {
    const GRANDCHILD_ID = "clp9z8x7w0000abcd1234grc1";

    const grandchild = makeSchema({ id: GRANDCHILD_ID, parentSchemaId: SUB_SCHEMA_ID_A });
    const child: SchemaWithBody = {
      ...makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID }),
      subSchemas: [grandchild],
    };

    expect(() =>
      renderSchemaCard({
        schema: makeSchema({ subSchemas: [child] }),
      }),
    ).not.toThrow();

    const subSchemaList = screen.getByTestId("schema-list-mock");

    expect(subSchemaList).toHaveAttribute("data-parent-schema-id", SCHEMA_ID);
    expect(subSchemaList).toHaveAttribute("data-schemas-count", "1");
  });
});

describe("SchemaCard body / SchemaRowList wiring", () => {
  it("renders SchemaRowList with rows, schemaId, planId and startDate from props", () => {
    const row: SchemaWithBody["rows"][number] = {
      id: "clp9z8x7w0000abcd1234row1",
      schemaId: SCHEMA_ID,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: "clp9z8x7w0000abcd1234exe1" },
      },
      load: null,
      reps: null,
      side: null,
      tempo: null,
      position: null,
      sequence: null,
      intensity: null,
      media: null,
      compoundRep: null,
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    };

    renderSchemaCard({ schema: makeSchema({ rows: [row] }) });

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

    expect(screen.getByTestId("schema-row-list-mock")).toHaveAttribute(
      "data-parent-pending",
      "true",
    );
  });

  it("passes effective pending down to nested SchemaList when parentIsReorderPending is true", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
      parentIsReorderPending: true,
    });

    expect(screen.getByTestId("schema-list-mock")).toHaveAttribute("data-parent-pending", "true");
  });

  it("passes data-parent-pending='false' to SchemaRowList when parentIsReorderPending is false", () => {
    renderSchemaCard();

    expect(screen.getByTestId("schema-row-list-mock")).toHaveAttribute(
      "data-parent-pending",
      "false",
    );
  });
});
