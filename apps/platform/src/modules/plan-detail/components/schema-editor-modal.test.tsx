import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Archetype } from "@repo/contracts/lms/archetype";
import type { ArchetypeParams, SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { SchemaEditorMode, SelectedArchetype } from "./schema-editor-types";

const createSchemaMutate = vi.fn();
const updateSchemaMutate = vi.fn();
const createSchemaState = { isPending: false };
const updateSchemaState = { isPending: false };
const archetypesState: { data: Archetype[] | undefined } = { data: [] };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchema: () => ({ mutate: createSchemaMutate, isPending: createSchemaState.isPending }),
    useUpdateSchema: () => ({ mutate: updateSchemaMutate, isPending: updateSchemaState.isPending }),
    useArchetypes: () => ({ data: archetypesState.data }),
  };
});

const { SchemaEditorModal } = await import("./schema-editor-modal");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";
const PAIR_ROW_ID = "clp9z8x7w0000abcd1234row1";

const makeArchetype = (overrides: Partial<Archetype> = {}): Archetype => ({
  id: ARCHETYPE_ID,
  name: "n-rounds",
  label: "N Rounds",
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
  params: { countForm: "exact", count: 5 },
};

const N_ROUNDS_ARCHETYPE: SelectedArchetype = {
  archetypeId: ARCHETYPE_ID,
  name: "n-rounds",
  kind: "ATOMIC",
};

const SUPER_SET_PARAMS: ArchetypeParams = {
  archetype: "super-set",
  params: {
    pairs: [{ label: "A", schemaRows: [PAIR_ROW_ID] }],
    rounds: 4,
  },
};

const makeSchemaWithBody = (archetypeParams: ArchetypeParams): SchemaWithBody => ({
  schema: {
    id: SCHEMA_ID,
    blockId: BLOCK_ID,
    parentSchemaId: null,
    alternatingGroupId: null,
    order: 1,
    kind: "ATOMIC",
    archetypeId: ARCHETYPE_ID,
    header: null,
    archetypeParams,
    intensity: null,
    trailingConnector: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  subSchemas: [],
});

const createMode: SchemaEditorMode = {
  kind: "create",
  blockId: BLOCK_ID,
  archetype: N_ROUNDS_ARCHETYPE,
};

const renderModal = (
  mode: SchemaEditorMode,
  extra: { open?: boolean; onBack?: () => void; onClose?: () => void } = {},
) =>
  render(
    <SchemaEditorModal
      open={extra.open ?? true}
      onClose={extra.onClose ?? vi.fn()}
      mode={mode}
      planId={PLAN_ID}
      startDate={START_DATE}
      {...(extra.onBack !== undefined && { onBack: extra.onBack })}
    />,
  );

const setHeader = (value: string): void => {
  fireEvent.change(screen.getByRole("textbox", { name: "Schema header" }), {
    target: { value },
  });
};

const submitCreate = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Create schema" }));
};

const submitSave = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
};

const getThemeInput = (): HTMLElement => {
  const input = screen
    .getAllByRole("textbox")
    .find((candidate) => candidate.getAttribute("aria-label") !== "Schema header");

  if (input === undefined) {
    throw new Error("expected a theme text field");
  }

  return input;
};

const renderNamedThemedCreate = (): void => {
  archetypesState.data = [makeArchetype({ name: "named-themed-sets", family: "NAMED" })];

  renderModal({
    kind: "create",
    blockId: BLOCK_ID,
    archetype: { archetypeId: ARCHETYPE_ID, name: "named-themed-sets", kind: "NAMED" },
  });
};

const setCountToInvalidRange = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "range" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Min" }), { target: { value: "9" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Max" }), { target: { value: "3" } });
};

afterEach(() => {
  createSchemaState.isPending = false;
  updateSchemaState.isPending = false;
  archetypesState.data = [makeArchetype()];
  createSchemaMutate.mockReset();
  updateSchemaMutate.mockReset();
});

describe("SchemaEditorModal open gating", () => {
  it("renders nothing when open is false", () => {
    const { container } = renderModal(createMode, { open: false });

    expect(container).toBeEmptyDOMElement();
  });
});

describe("SchemaEditorModal create submit assembly (D-LOCK-1)", () => {
  it("sends header:null and intensity:null when neither is set", async () => {
    renderModal(createMode);

    submitCreate();

    await waitFor(() => {
      expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      kind: "ATOMIC",
      archetypeId: ARCHETYPE_ID,
      header: null,
      intensity: null,
      archetypeParams: { archetype: "n-rounds", params: { countForm: "exact", count: 5 } },
    });
  });

  it("trims a header and sends both header and intensity when both are set", async () => {
    renderModal(createMode);

    setHeader("  Strength  ");
    fireEvent.click(screen.getByText("RPE"));
    submitCreate();

    await waitFor(() => {
      expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      kind: "ATOMIC",
      archetypeId: ARCHETYPE_ID,
      header: "Strength",
      intensity: { rpe: { value: 8 } },
      archetypeParams: { archetype: "n-rounds", params: { countForm: "exact", count: 5 } },
    });
  });

  it("serializes a whitespace-only header to null", async () => {
    renderModal(createMode);

    setHeader("    ");
    submitCreate();

    await waitFor(() => {
      expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({ header: null });
  });

  it("serializes intensity back to null after toggling an axis on then off (never {})", async () => {
    renderModal(createMode);

    fireEvent.click(screen.getByText("RPE"));
    fireEvent.click(screen.getByText("RPE"));
    submitCreate();

    await waitFor(() => {
      expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({ intensity: null });
  });
});

describe("SchemaEditorModal edit submit assembly", () => {
  it("calls updateSchema with the schemaId and the header/intensity/archetypeParams payload", async () => {
    renderModal({ kind: "edit", schema: makeSchemaWithBody(N_ROUNDS_PARAMS) });

    setHeader("Conditioning");
    submitSave();

    await waitFor(() => {
      expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      data: {
        header: "Conditioning",
        intensity: null,
        archetypeParams: { archetype: "n-rounds", params: { countForm: "exact", count: 5 } },
      },
    });
  });
});

describe("SchemaEditorModal invalid params (QA-11)", () => {
  it("surfaces the contract validation error on the param field when an in-scope submit fails", async () => {
    renderNamedThemedCreate();

    fireEvent.change(getThemeInput(), { target: { value: "Benchmarks" } });
    setCountToInvalidRange();

    const maxInput = screen.getByRole("spinbutton", { name: "Max" });

    expect(maxInput).toHaveAttribute("aria-invalid", "false");

    submitCreate();

    await waitFor(() => {
      expect(screen.getByText("range.min must be less than range.max")).toBeInTheDocument();
    });
    expect(maxInput).toHaveAttribute("aria-invalid", "true");
    expect(createSchemaMutate).not.toHaveBeenCalled();
  });

  it("blocks the create mutation when a required param field is empty (native constraint)", async () => {
    renderNamedThemedCreate();

    submitCreate();

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(createSchemaMutate).not.toHaveBeenCalled();
  });

  it("lets the create mutation through with the right archetypeParams once the fields are valid", async () => {
    renderNamedThemedCreate();

    fireEvent.change(getThemeInput(), { target: { value: "Benchmarks" } });
    submitCreate();

    await waitFor(() => {
      expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    });
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({
      archetypeParams: {
        archetype: "named-themed-sets",
        params: { count: 4, theme: "Benchmarks" },
      },
    });
  });
});

describe("SchemaEditorModal deferred-archetype edit (QA-12 regression)", () => {
  it("renders the no-params notice for a deferred super-set schema without crashing", () => {
    archetypesState.data = [makeArchetype({ name: "super-set", family: "ROUNDS_SETS" })];

    renderModal({ kind: "edit", schema: makeSchemaWithBody(SUPER_SET_PARAMS) });

    expect(
      screen.getByText("super-set has no parameters — its shape is its body (the rows)."),
    ).toBeInTheDocument();
  });

  it("fires updateSchema with the ORIGINAL super-set params (never {}) and the updated header", async () => {
    archetypesState.data = [makeArchetype({ name: "super-set", family: "ROUNDS_SETS" })];

    renderModal({ kind: "edit", schema: makeSchemaWithBody(SUPER_SET_PARAMS) });

    setHeader("Pairs day");
    submitSave();

    await waitFor(() => {
      expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    });

    const payload = updateSchemaMutate.mock.calls[0]?.[0] as
      | { schemaId: string; data: { header: string | null; archetypeParams: ArchetypeParams } }
      | undefined;

    expect(payload?.schemaId).toBe(SCHEMA_ID);
    expect(payload?.data.header).toBe("Pairs day");
    expect(payload?.data.archetypeParams).toEqual(SUPER_SET_PARAMS);
    expect(payload?.data.archetypeParams.params).not.toEqual({});
  });
});

describe("SchemaEditorModal Back affordance (D-LOCK-12)", () => {
  it("renders Back in create mode when onBack is supplied", () => {
    renderModal(createMode, { onBack: vi.fn() });

    expect(screen.getByRole("button", { name: "← Back" })).toBeInTheDocument();
  });

  it("does not render Back in create mode when onBack is omitted", () => {
    renderModal(createMode);

    expect(screen.queryByRole("button", { name: "← Back" })).toBeNull();
  });

  it("does not render Back in edit mode even when onBack is supplied", () => {
    renderModal({ kind: "edit", schema: makeSchemaWithBody(N_ROUNDS_PARAMS) }, { onBack: vi.fn() });

    expect(screen.queryByRole("button", { name: "← Back" })).toBeNull();
  });

  it("invokes onBack when Back is clicked", () => {
    const onBack = vi.fn();

    renderModal(createMode, { onBack });

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
