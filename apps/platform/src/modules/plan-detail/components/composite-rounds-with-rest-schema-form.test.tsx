import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { ArchetypeParams, SchemaWithBody } from "@repo/contracts/lms/schema";

import { render } from "@app/test/render";

import {
  CompositeRoundsWithRestForm,
  compositeRoundsWithRestDefaultParams,
  toCompositeRoundsWithRestParams,
} from "./composite-rounds-with-rest-schema-form";
import type { SchemaEditorMode } from "./schema-editor-types";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

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
    kind: "COMPOSITE",
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

describe("CompositeRoundsWithRestForm rendering", () => {
  it("renders the rest fields unconditionally (rest is required, no add/remove)", () => {
    render(
      <CompositeRoundsWithRestForm
        value={compositeRoundsWithRestDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Rest value" })).toBeInTheDocument();
    expect(screen.getByText("Between rounds")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add rest/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /remove rest/i })).toBeNull();
  });

  it("renders a single count field for an exact count", () => {
    render(
      <CompositeRoundsWithRestForm
        value={compositeRoundsWithRestDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Count" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "range" })).toBeInTheDocument();
  });
});

describe("CompositeRoundsWithRestForm count exact <-> range", () => {
  it("switches the count to a range while preserving rest", () => {
    render(
      <CompositeRoundsWithRestForm
        value={{
          count: 5,
          rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "range" }));

    expect(onChange).toHaveBeenCalledWith({
      count: { min: 5, max: 6 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
    });
  });

  it("collapses a range count back to its min while preserving rest", () => {
    render(
      <CompositeRoundsWithRestForm
        value={{
          count: { min: 3, max: 5 },
          rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "exact" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "exact" }));

    expect(onChange).toHaveBeenCalledWith({
      count: 3,
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
    });
  });
});

describe("toCompositeRoundsWithRestParams", () => {
  it("returns the default params in create mode", () => {
    const mode: SchemaEditorMode = {
      kind: "create",
      blockId: BLOCK_ID,
      archetype: {
        archetypeId: ARCHETYPE_ID,
        name: "composite-rounds-with-rest",
        kind: "COMPOSITE",
      },
    };

    expect(toCompositeRoundsWithRestParams(mode)).toEqual(compositeRoundsWithRestDefaultParams);
  });

  it("round-trips the persisted params in edit mode", () => {
    const params = {
      count: { min: 2, max: 4 },
      rest: { duration: { value: 120, unit: "sec" }, scope: "between_rounds" },
    } as const;
    const mode: SchemaEditorMode = {
      kind: "edit",
      schema: makeSchemaWithBody({ archetype: "composite-rounds-with-rest", params }),
    };

    expect(toCompositeRoundsWithRestParams(mode)).toEqual(params);
  });

  it("falls back to the default when the edited archetype does not match", () => {
    const mode: SchemaEditorMode = {
      kind: "edit",
      schema: makeSchemaWithBody({ archetype: "amrap-flat", params: { durationMin: 12 } }),
    };

    expect(toCompositeRoundsWithRestParams(mode)).toEqual(compositeRoundsWithRestDefaultParams);
  });
});
