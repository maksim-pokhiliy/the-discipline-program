import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Intensity, TimeCap } from "@repo/contracts/lms/_shared";
import type { Archetype } from "@repo/contracts/lms/archetype";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { ArchetypeParams, SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { BlockCtx } from "../lib/build-cascade-chips";

const updateSchemaMutate = vi.fn();
const deleteSchemaMutate = vi.fn();
const updateSchemaState = { isPending: false };
const deleteSchemaState = { isPending: false };
const archetypesState: { data: Archetype[] | undefined } = { data: [] };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSchema: () => ({
      mutate: updateSchemaMutate,
      isPending: updateSchemaState.isPending,
    }),
    useDeleteSchema: () => ({
      mutate: deleteSchemaMutate,
      isPending: deleteSchemaState.isPending,
    }),
    useArchetypes: () => ({ data: archetypesState.data }),
  };
});

vi.mock("./schema-row-list", () => {
  const renderRowListMock = (props: {
    rows: SchemaWithBody["rows"];
    schemaId: string;
    planId: string;
    startDate: string;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-list-mock",
        "data-rows": String(props.rows.length),
        "data-schema-id": props.schemaId,
        "data-plan-id": props.planId,
        "data-start-date": props.startDate,
      },
      `row-list:${String(props.rows.length)}`,
    );

  return { SchemaRowList: renderRowListMock };
});

vi.mock("./schema-editor-modal", () => {
  const renderEditorMock = (props: { open: boolean }) =>
    props.open
      ? createElement("div", {
          "data-testid": "schema-editor-modal-mock",
          "data-open": String(props.open),
        })
      : null;

  return { SchemaEditorModal: renderEditorMock };
});

const { SchemaCard } = await import("./schema-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const SUB_SCHEMA_ID_A = "clp9z8x7w0000abcd1234ssa1";
const SUB_SCHEMA_ID_B = "clp9z8x7w0000abcd1234ssb1";
const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";
const ARCHETYPE_LABEL = "N Rounds";
const DRAG_LABEL = "Drag schema";
const KEBAB_LABEL = "Schema actions";
const TITLE_LABEL = "Schema title";

type MakeSchemaOverrides = Partial<SchemaWithBody["schema"]> & {
  rows?: SchemaWithBody["rows"];
  subSchemas?: SchemaWithBody[];
};

const makeArchetype = (overrides: Partial<Archetype> = {}): Archetype => ({
  id: ARCHETYPE_ID,
  name: "n-rounds",
  label: ARCHETYPE_LABEL,
  kind: "ATOMIC",
  family: "ROUNDS_SETS",
  headerPatternDescription: "",
  bodyLayoutDescription: "",
  archetypeParamsSchema: {},
  relatedArchetypes: {},
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const N_ROUNDS_PARAMS: ArchetypeParams = {
  archetype: "n-rounds",
  params: { countForm: "exact", count: 5, repsPerSet: 8 },
};

const makeSchema = (overrides: MakeSchemaOverrides = {}): SchemaWithBody => {
  const { rows, subSchemas, ...schemaOverrides } = overrides;

  return {
    schema: {
      id: SCHEMA_ID,
      blockId: BLOCK_ID,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: ARCHETYPE_ID,
      header: null,
      archetypeParams: N_ROUNDS_PARAMS,
      intensity: null,
      trailingConnector: null,
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
  isSubSchema?: boolean;
};

const EMPTY_EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map();

const renderSchemaCard = ({
  schema = makeSchema(),
  blockCtx = makeBlockCtx(),
  isSubSchema,
}: RenderOptions = {}) =>
  render(
    <SchemaCard
      schema={schema}
      planId={PLAN_ID}
      startDate={START_DATE}
      blockCtx={blockCtx}
      exerciseById={EMPTY_EXERCISE_BY_ID}
      {...(isSubSchema !== undefined && { isSubSchema })}
    />,
  );

afterEach(() => {
  updateSchemaState.isPending = false;
  deleteSchemaState.isPending = false;
  archetypesState.data = [makeArchetype()];
  updateSchemaMutate.mockReset();
  deleteSchemaMutate.mockReset();
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

  it("renders sub-schemas Stack BETWEEN meta and body when subSchemas non-empty", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
    });

    const titleInputs = screen.getAllByRole("textbox", { name: TITLE_LABEL });

    expect(titleInputs).toHaveLength(2);

    const parentTitle = titleInputs[0];
    const subTitle = titleInputs[1];
    const rowLists = screen.getAllByTestId("schema-row-list-mock");
    const parentRowList = rowLists.find((n) => n.getAttribute("data-schema-id") === SCHEMA_ID);

    if (parentTitle === undefined || subTitle === undefined || parentRowList === undefined) {
      throw new Error("expected nodes missing");
    }

    expect(
      parentTitle.compareDocumentPosition(subTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(
      subTitle.compareDocumentPosition(parentRowList) & Node.DOCUMENT_POSITION_FOLLOWING,
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

  it("does NOT render the drag handle when isSubSchema=true", () => {
    renderSchemaCard({ isSubSchema: true });

    expect(screen.queryByRole("button", { name: DRAG_LABEL })).toBeNull();
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

describe("SchemaCard archetype tag", () => {
  it("renders the archetype label from useArchetypes() when found in the catalog", () => {
    archetypesState.data = [makeArchetype({ label: ARCHETYPE_LABEL })];

    renderSchemaCard();

    expect(screen.getByText(ARCHETYPE_LABEL)).toBeInTheDocument();
  });

  it("falls back to the discriminator string when useArchetypes() returns empty", () => {
    archetypesState.data = [];

    renderSchemaCard();

    expect(screen.getByText("n-rounds")).toBeInTheDocument();
  });

  it("falls back to the discriminator string when useArchetypes() data is undefined (loading)", () => {
    archetypesState.data = undefined;

    renderSchemaCard();

    expect(screen.getByText("n-rounds")).toBeInTheDocument();
  });

  it("falls back to discriminator when useArchetypes data is undefined (loading or error) (MT-5)", () => {
    archetypesState.data = undefined;

    expect(() => renderSchemaCard()).not.toThrow();
    expect(screen.getByText("n-rounds")).toBeInTheDocument();
    expect(screen.queryByText(ARCHETYPE_LABEL)).toBeNull();
  });
});

describe("SchemaCard title", () => {
  it("renders the InlineEditText with formatSchemaHeader output when schema.header is null", () => {
    archetypesState.data = [makeArchetype({ label: ARCHETYPE_LABEL })];

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
  it("renders archetype param chips for an n-rounds count_times_reps schema with rest", () => {
    renderSchemaCard({
      schema: makeSchema({
        archetypeParams: {
          archetype: "n-rounds",
          params: {
            countForm: "count_times_reps",
            count: 5,
            repsPerSet: 5,
            rest: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
          },
        },
      }),
    });

    expect(screen.getByText("5 × 5")).toBeInTheDocument();
    expect(screen.getByText("rest 2 min between rounds")).toBeInTheDocument();
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

  it("renders the 'no params' italic fallback when paramTexts, ownChips, cascadeChips and cap are all empty", () => {
    renderSchemaCard({
      schema: makeSchema({
        archetypeParams: { archetype: "single-line-bare", params: {} },
      }),
    });

    expect(screen.getByText("no params")).toBeInTheDocument();
  });

  it("renders duplicate-shape ladders without React duplicate-key warning (MT-4 + QA-007)", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      renderSchemaCard({
        schema: makeSchema({
          archetypeParams: {
            archetype: "parallel-ladders-mixed-direction",
            params: {
              ladders: [
                { steps: [12, 9, 6], direction: "desc" },
                { steps: [12, 9, 6], direction: "desc" },
              ],
            },
          },
        }),
      });

      expect(screen.getByText("2 parallel ladders")).toBeInTheDocument();
      expect(screen.getAllByText("12-9-6 (desc)")).toHaveLength(2);

      const duplicateKeyWarnings = consoleErrorSpy.mock.calls.filter((args) => {
        const first = args[0];

        return typeof first === "string" && first.includes("two children with the same key");
      });

      expect(duplicateKeyWarnings).toHaveLength(0);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

describe("SchemaCard kebab + modals", () => {
  it("opens the SchemaEditorModal when Edit is clicked in the kebab menu", () => {
    renderSchemaCard();

    expect(screen.queryByTestId("schema-editor-modal-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Edit"));

    expect(screen.getByTestId("schema-editor-modal-mock")).toBeInTheDocument();
  });

  it("opens the ConfirmationModal when Delete is clicked, then fires useDeleteSchema.mutate on confirm", () => {
    renderSchemaCard();

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Delete"));

    expect(screen.getByRole("heading", { name: "Delete schema" })).toBeInTheDocument();
    expect(screen.getByText("Delete this schema?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaMutate.mock.calls[0]?.[0]).toEqual({ schemaId: SCHEMA_ID });
  });

  it("passes formatSchemaHeader(schema, archetypeLabel) as the ConfirmationModal details copy", () => {
    archetypesState.data = [makeArchetype({ label: ARCHETYPE_LABEL })];

    renderSchemaCard({
      schema: makeSchema({
        archetypeParams: {
          archetype: "amrap-flat",
          params: { durationMin: 12 },
        },
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Delete"));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("AMRAP 12 min")).toBeInTheDocument();
  });

  it("does NOT render the kebab IconButton when isSubSchema=true", () => {
    renderSchemaCard({ isSubSchema: true });

    expect(screen.queryByRole("button", { name: KEBAB_LABEL })).toBeNull();
  });

  it("disables the kebab IconButton when useUpdateSchema is pending", () => {
    updateSchemaState.isPending = true;

    renderSchemaCard();

    expect(screen.getByRole("button", { name: KEBAB_LABEL })).toBeDisabled();
  });
});

describe("SchemaCard sub-schemas", () => {
  it("recursively renders a SchemaCard per entry in schema.subSchemas", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [
          makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID }),
          makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID }),
        ],
      }),
    });

    const rowLists = screen.getAllByTestId("schema-row-list-mock");
    const schemaIds = rowLists.map((n) => n.getAttribute("data-schema-id"));

    expect(rowLists).toHaveLength(3);
    expect(schemaIds).toContain(SCHEMA_ID);
    expect(schemaIds).toContain(SUB_SCHEMA_ID_A);
    expect(schemaIds).toContain(SUB_SCHEMA_ID_B);
  });

  it("renders sub-schemas WITHOUT drag handle and WITHOUT kebab (isSubSchema=true cascade)", () => {
    renderSchemaCard({
      schema: makeSchema({
        subSchemas: [makeSchema({ id: SUB_SCHEMA_ID_A, parentSchemaId: SCHEMA_ID })],
      }),
    });

    const dragHandles = screen.getAllByRole("button", { name: DRAG_LABEL });
    const kebabs = screen.getAllByRole("button", { name: KEBAB_LABEL });

    expect(dragHandles).toHaveLength(1);
    expect(kebabs).toHaveLength(1);
  });

  it("renders nothing for sub-schemas when schema.subSchemas is an empty array", () => {
    renderSchemaCard({ schema: makeSchema({ subSchemas: [] }) });

    const dragHandles = screen.getAllByRole("button", { name: DRAG_LABEL });
    const kebabs = screen.getAllByRole("button", { name: KEBAB_LABEL });
    const rowLists = screen.getAllByTestId("schema-row-list-mock");

    expect(dragHandles).toHaveLength(1);
    expect(kebabs).toHaveLength(1);
    expect(rowLists).toHaveLength(1);
  });

  it("renders the cap cascade chip on every schema (top-level + sub-schemas) per D-13/D-19/D-22 (MT-6 + QA-005)", () => {
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

    expect(screen.getAllByText("cap 10:00")).toHaveLength(3);
  });

  it("renders three levels gracefully when sub-schemas nest beyond contract depth (MT-7 + QA-006)", () => {
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

    const rowLists = screen.getAllByTestId("schema-row-list-mock");
    const schemaIds = rowLists.map((n) => n.getAttribute("data-schema-id"));

    expect(rowLists).toHaveLength(3);
    expect(schemaIds).toContain(SCHEMA_ID);
    expect(schemaIds).toContain(SUB_SCHEMA_ID_A);
    expect(schemaIds).toContain(GRANDCHILD_ID);
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

describe("SchemaCard double-click", () => {
  it("opens the SchemaEditorModal when a top-level schema card outer Stack is double-clicked", () => {
    const { container } = renderSchemaCard();
    const shell = container.firstChild;

    expect(screen.queryByTestId("schema-editor-modal-mock")).toBeNull();

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected schema-card shell to be an HTMLElement");
    }

    fireEvent.doubleClick(shell);

    expect(screen.getByTestId("schema-editor-modal-mock")).toBeInTheDocument();
  });

  it("does not open the SchemaEditorModal when a sub-schema is double-clicked", () => {
    const { container } = renderSchemaCard({ isSubSchema: true });
    const shell = container.firstChild;

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected sub-schema-card shell to be an HTMLElement");
    }

    fireEvent.doubleClick(shell);

    expect(screen.queryByTestId("schema-editor-modal-mock")).toBeNull();
  });
});
