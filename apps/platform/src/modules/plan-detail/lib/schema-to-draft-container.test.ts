import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeNode } from "../components/axes/axis-draft.types";

import { composeContainerToComposition } from "./compose-container-to-composition";
import { schemaWithBodyToDraftContainer } from "./schema-to-draft-container";

const EPOCH = new Date(0);
const TOP_ID = "cktop1234567890abcdef01234";
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
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const schema = (
  id: string,
  composition: Composition | null,
  rows: SchemaRow[],
): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: null,
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
});

const onlyRowIds = (children: ComposeNode[]): string[] =>
  children.filter((child) => child.nodeType === "row").map((child) => child.id);

describe("schemaWithBodyToDraftContainer rebuilds the draft container", () => {
  it("rebuilds the container axes from the stored composition", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    };

    const container = schemaWithBodyToDraftContainer(schema(TOP_ID, composition, []));

    expect(container.id).toBe(TOP_ID);
    expect(container.repetition).toEqual({ kind: "count", count: 5 });
    expect(container.rest).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });

  it("rebuilds direct rows as row children carrying the persisted id", () => {
    const container = schemaWithBodyToDraftContainer(
      schema(TOP_ID, null, [restSlotRow(ROW_ID, TOP_ID)]),
    );

    expect(onlyRowIds(container.children)).toEqual([ROW_ID]);
  });

  it("leaves the container axis-free when the stored composition is null", () => {
    const container = schemaWithBodyToDraftContainer(schema(TOP_ID, null, []));

    expect(container.repetition).toBeUndefined();
    expect(container.rest).toBeUndefined();
  });
});

describe("schemaWithBodyToDraftContainer round-trips stored compositions through emission", () => {
  it("re-emits an empty composition as exactly {}", () => {
    const draft = schemaWithBodyToDraftContainer(schema(TOP_ID, {}, []));

    expect(composeContainerToComposition(draft)).toEqual({});
  });

  it("re-emits a stored repetition + rest composition byte-for-byte", () => {
    const stored: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    };

    const draft = schemaWithBodyToDraftContainer(schema(TOP_ID, stored, []));

    expect(composeContainerToComposition(draft)).toEqual(stored);
  });
});
