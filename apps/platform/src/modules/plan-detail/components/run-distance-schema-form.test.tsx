import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { ArchetypeParams, SchemaWithBody } from "@repo/contracts/lms/schema";

import { render } from "@app/test/render";

import {
  RunDistanceForm,
  runDistanceDefaultParams,
  toRunDistanceParams,
} from "./run-distance-schema-form";
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
    kind: "ATOMIC",
    archetypeId: ARCHETYPE_ID,
    header: null,
    archetypeParams,
    intensity: null,
    trailingConnector: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  subSchemas: [],
});

describe("RunDistanceForm km-only rendering", () => {
  it("renders a single distance field with no unit selector (km-only)", () => {
    render(<RunDistanceForm value={runDistanceDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Distance" })).toBeInTheDocument();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByRole("button", { name: "mi" })).toBeNull();
    expect(screen.queryByRole("button", { name: "m" })).toBeNull();
  });

  it("seeds modality RUN and 5 km as the default params", () => {
    expect(runDistanceDefaultParams).toEqual({
      modality: "RUN",
      distance: { unit: "km", value: 5 },
    });
  });
});

describe("RunDistanceForm decimal entry", () => {
  it("accepts a decimal distance and emits it on the value field", () => {
    render(<RunDistanceForm value={runDistanceDefaultParams} onChange={onChange} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: "Distance" }), {
      target: { value: "5.5" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      modality: "RUN",
      distance: { unit: "km", value: 5.5 },
    });
  });
});

describe("RunDistanceForm value <-> range toggle", () => {
  it("switches to a range with the km defaults", () => {
    render(<RunDistanceForm value={runDistanceDefaultParams} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "range" }));

    expect(onChange).toHaveBeenCalledWith({
      modality: "RUN",
      distance: { unit: "km", range: { min: 5, max: 8 } },
    });
  });

  it("renders min and max fields in range mode and switches back to a single value", () => {
    render(
      <RunDistanceForm
        value={{ modality: "RUN", distance: { unit: "km", range: { min: 5, max: 8 } } }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Min" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Max" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "exact" }));

    expect(onChange).toHaveBeenCalledWith({
      modality: "RUN",
      distance: { unit: "km", value: 5 },
    });
  });
});

describe("toRunDistanceParams", () => {
  it("returns the default params in create mode", () => {
    const mode: SchemaEditorMode = {
      kind: "create",
      blockId: BLOCK_ID,
      archetype: { archetypeId: ARCHETYPE_ID, name: "run-distance", kind: "ATOMIC" },
    };

    expect(toRunDistanceParams(mode)).toEqual(runDistanceDefaultParams);
  });

  it("round-trips the persisted distance in edit mode", () => {
    const mode: SchemaEditorMode = {
      kind: "edit",
      schema: makeSchemaWithBody({
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km", value: 10 } },
      }),
    };

    expect(toRunDistanceParams(mode)).toEqual({
      modality: "RUN",
      distance: { unit: "km", value: 10 },
    });
  });

  it("falls back to the default when the edited archetype does not match", () => {
    const mode: SchemaEditorMode = {
      kind: "edit",
      schema: makeSchemaWithBody({ archetype: "amrap-flat", params: { durationMin: 12 } }),
    };

    expect(toRunDistanceParams(mode)).toEqual(runDistanceDefaultParams);
  });
});
