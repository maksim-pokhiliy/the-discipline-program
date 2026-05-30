import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { ArchetypeParams, SchemaWithBody } from "@repo/contracts/lms/schema";

import { render } from "@app/test/render";

import {
  LADDER_DEFAULTS,
  type LadderFlavour,
  LadderForm,
  toLadderParams,
} from "./ladder-schema-form";
import type { SchemaEditorMode } from "./schema-editor-types";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const FLAVOURS: LadderFlavour[] = ["descending", "ascending", "vertex-down-pyramid", "spike"];

const FLAVOUR_CAPTIONS: Record<LadderFlavour, string> = {
  descending: "Strictly descending.",
  ascending: "Strictly ascending.",
  "vertex-down-pyramid": "Symmetric pyramid (central min).",
  spike: "Descending then a final upward spike.",
};

const FLAVOUR_ARCHETYPES: Record<LadderFlavour, ArchetypeParams["archetype"]> = {
  descending: "ladder-descending",
  ascending: "ladder-ascending",
  "vertex-down-pyramid": "ladder-vertex-down-pyramid",
  spike: "ladder-spike",
};

const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

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

const removeStepAt = (index: number): void => {
  const buttons = screen.getAllByRole("button", { name: "Remove step" });
  const target = buttons[index];

  if (target === undefined) {
    throw new Error(`no Remove step button at index ${index}`);
  }

  fireEvent.click(target);
};

describe("LadderForm rendering", () => {
  it("renders the descending default steps as editable cells", () => {
    render(
      <LadderForm value={LADDER_DEFAULTS.descending} onChange={onChange} flavour="descending" />,
    );

    expect(screen.getByDisplayValue("21")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("9")).toBeInTheDocument();
  });

  it.each(FLAVOURS)("renders the flavour-specific caption for %s", (flavour) => {
    render(<LadderForm value={LADDER_DEFAULTS[flavour]} onChange={onChange} flavour={flavour} />);

    expect(screen.getByText(FLAVOUR_CAPTIONS[flavour])).toBeInTheDocument();
  });
});

describe("LadderForm step editing", () => {
  it("emits onChange with a step duplicating the last value when add step is clicked", () => {
    render(<LadderForm value={{ steps: [21, 15, 9] }} onChange={onChange} flavour="descending" />);

    fireEvent.click(screen.getByRole("button", { name: "add step" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ steps: [21, 15, 9, 9] });
  });

  it("emits onChange with the edited value when a cell is changed", () => {
    render(<LadderForm value={{ steps: [21, 15, 9] }} onChange={onChange} flavour="descending" />);

    fireEvent.change(screen.getByDisplayValue("15"), { target: { value: "12" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ steps: [21, 12, 9] });
  });

  it("emits onChange without the removed step when a cell remove is clicked", () => {
    render(<LadderForm value={{ steps: [21, 15, 9] }} onChange={onChange} flavour="descending" />);

    removeStepAt(1);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ steps: [21, 9] });
  });

  it("disables the remove affordance when only one step remains (MIN_STEPS)", () => {
    render(<LadderForm value={{ steps: [9] }} onChange={onChange} flavour="descending" />);

    expect(screen.getByRole("button", { name: "Remove step" })).toBeDisabled();
  });
});

describe("LadderForm error surfacing", () => {
  it("renders the steps error message when error.steps is passed", () => {
    render(
      <LadderForm
        value={{ steps: [21, 15, 9] }}
        onChange={onChange}
        flavour="descending"
        error={{
          steps: { type: "too_small", message: "Array must contain at least 1 element(s)" },
        }}
      />,
    );

    expect(screen.getByText("Array must contain at least 1 element(s)")).toBeInTheDocument();
  });
});

describe("LADDER_DEFAULTS and toLadderParams cover all four flavours", () => {
  it.each(FLAVOURS)("seeds the create-mode default for %s", (flavour) => {
    const mode: SchemaEditorMode = {
      kind: "create",
      blockId: BLOCK_ID,
      archetype: { archetypeId: ARCHETYPE_ID, name: FLAVOUR_ARCHETYPES[flavour], kind: "ATOMIC" },
    };

    expect(toLadderParams(mode, flavour)).toEqual(LADDER_DEFAULTS[flavour]);
  });

  it.each(FLAVOURS)("round-trips an edit-mode schema for %s", (flavour) => {
    const archetypeParams = {
      archetype: FLAVOUR_ARCHETYPES[flavour],
      params: { steps: [12, 9, 6] },
    } as ArchetypeParams;
    const mode: SchemaEditorMode = { kind: "edit", schema: makeSchemaWithBody(archetypeParams) };

    expect(toLadderParams(mode, flavour)).toEqual({ steps: [12, 9, 6] });
  });

  it("falls back to the flavour default when the edited archetype does not match", () => {
    const mode: SchemaEditorMode = {
      kind: "edit",
      schema: makeSchemaWithBody({ archetype: "ladder-ascending", params: { steps: [1, 2, 3] } }),
    };

    expect(toLadderParams(mode, "spike")).toEqual(LADDER_DEFAULTS.spike);
  });
});

describe("LadderForm cell count integration", () => {
  it("renders one enabled remove affordance per step when above the minimum", () => {
    render(<LadderForm value={{ steps: [21, 15, 9, 30] }} onChange={onChange} flavour="spike" />);

    const buttons = screen.getAllByRole("button", { name: "Remove step" });

    expect(buttons).toHaveLength(4);
    buttons.forEach((button) => expect(button).toBeEnabled());
  });
});
