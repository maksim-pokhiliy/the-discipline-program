import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer, ComposeNode } from "../components/axes/axis-draft.types";

import { schemaWithBodyToDraftContainer } from "./schema-to-draft-container";

const EPOCH = new Date(0);
const TOP_ID = "cktop1234567890abcdef01234";
const SUB_ID = "cksub1234567890abcdef01234";
const ROW_ID = "ckrow1234567890abcdef01234";
const BLOCK_ID = "ckblk1234567890abcdef01234";

const restSlotRow = (id: string, schemaId: string): SchemaRow => ({
  id,
  schemaId,
  order: 1,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
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
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const schema = (
  id: string,
  composition: Composition | null,
  rows: SchemaRow[],
  subSchemas: SchemaWithBody[],
): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    parentSchemaId: null,
    order: 1,
    header: null,
    intensity: null,
    composition,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows,
  subSchemas,
});

const onlyRowIds = (children: ComposeNode[]): string[] =>
  children.filter((child) => child.nodeType === "row").map((child) => child.id);

const onlyContainers = (children: ComposeNode[]): ComposeContainer[] =>
  children.filter((child): child is ComposeContainer => child.nodeType === "container");

describe("schemaWithBodyToDraftContainer rebuilds the draft container", () => {
  it("rebuilds the container axes from the stored composition", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      programKind: "wave",
    };

    const result = schemaWithBodyToDraftContainer(schema(TOP_ID, composition, [], []));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.container.id).toBe(TOP_ID);
    expect(result.container.repetition).toEqual({ kind: "count", count: 5 });
    expect(result.container.rest).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
    expect(result.container.programKind).toBe("wave");
  });

  it("rebuilds direct rows as row children carrying the persisted id", () => {
    const result = schemaWithBodyToDraftContainer(
      schema(TOP_ID, null, [restSlotRow(ROW_ID, TOP_ID)], []),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(onlyRowIds(result.container.children)).toEqual([ROW_ID]);
  });

  it("rebuilds sub-schemas as nested container children", () => {
    const sub = schema(SUB_ID, { repetition: { kind: "once" } }, [], []);
    const result = schemaWithBodyToDraftContainer(schema(TOP_ID, null, [], [sub]));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const containers = onlyContainers(result.container.children);

    expect(containers).toHaveLength(1);
    expect(containers[0]?.id).toBe(SUB_ID);
    expect(containers[0]?.repetition).toEqual({ kind: "once" });
  });

  it("leaves the container axis-free when the stored composition is null", () => {
    const result = schemaWithBodyToDraftContainer(schema(TOP_ID, null, [], []));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.container.repetition).toBeUndefined();
    expect(result.container.arrangement).toBeUndefined();
    expect(result.container.rest).toBeUndefined();
  });
});

describe("schemaWithBodyToDraftContainer refuses unrepresentable repetitions", () => {
  it("refuses a top-level range repetition with the schema id and kind", () => {
    const result = schemaWithBodyToDraftContainer(
      schema(TOP_ID, { repetition: { kind: "range", range: { min: 3, max: 5 } } }, [], []),
    );

    expect(result).toEqual({
      ok: false,
      reason: { kind: "unrepresentable-repetition", schemaId: TOP_ID, repetitionKind: "range" },
    });
  });

  it("refuses when a nested sub-schema carries a range repetition", () => {
    const sub = schema(
      SUB_ID,
      { repetition: { kind: "range", range: { min: 2, max: 4 } } },
      [],
      [],
    );
    const result = schemaWithBodyToDraftContainer(
      schema(TOP_ID, { repetition: { kind: "count", count: 3 } }, [], [sub]),
    );

    expect(result).toEqual({
      ok: false,
      reason: { kind: "unrepresentable-repetition", schemaId: SUB_ID, repetitionKind: "range" },
    });
  });
});
