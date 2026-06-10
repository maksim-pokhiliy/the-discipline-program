import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer, ComposeNode } from "../components/axes/axis-draft.types";

import { composeContainerToComposition } from "./compose-container-to-composition";
import { schemaWithBodyToDraftContainer } from "./schema-to-draft-container";

const EPOCH = new Date(0);
const TOP_ID = "cktop1234567890abcdef01234";
const SUB_ID = "cksub1234567890abcdef01234";
const SUB_ID_B = "cksub2234567890abcdef01234";
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

const ladderSub = (id: string, steps: number[]): SchemaWithBody =>
  schema(id, { repetition: { kind: "ladder", steps } }, [], []);

const parallelParent = (composition: Composition): SchemaWithBody =>
  schema(
    TOP_ID,
    composition,
    [],
    [ladderSub(SUB_ID, [21, 15, 9]), ladderSub(SUB_ID_B, [15, 12, 9])],
  );

describe("schemaWithBodyToDraftContainer rebuilds the draft container", () => {
  it("rebuilds the container axes from the stored composition", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    };

    const container = schemaWithBodyToDraftContainer(schema(TOP_ID, composition, [], []));

    expect(container.id).toBe(TOP_ID);
    expect(container.repetition).toEqual({ kind: "count", count: 5 });
    expect(container.rest).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });

  it("rebuilds direct rows as row children carrying the persisted id", () => {
    const container = schemaWithBodyToDraftContainer(
      schema(TOP_ID, null, [restSlotRow(ROW_ID, TOP_ID)], []),
    );

    expect(onlyRowIds(container.children)).toEqual([ROW_ID]);
  });

  it("rebuilds sub-schemas as nested container children", () => {
    const sub = schema(SUB_ID, { repetition: { kind: "once" } }, [], []);
    const container = schemaWithBodyToDraftContainer(schema(TOP_ID, null, [], [sub]));

    const containers = onlyContainers(container.children);

    expect(containers).toHaveLength(1);
    expect(containers[0]?.id).toBe(SUB_ID);
    expect(containers[0]?.repetition).toEqual({ kind: "once" });
  });

  it("leaves the container axis-free when the stored composition is null", () => {
    const container = schemaWithBodyToDraftContainer(schema(TOP_ID, null, [], []));

    expect(container.repetition).toBeUndefined();
    expect(container.arrangement).toBeUndefined();
    expect(container.rest).toBeUndefined();
  });
});

describe("schemaWithBodyToDraftContainer maps structural parallels", () => {
  it("yields two child containers with no arrangement and no interleaveOrder for an empty parent composition", () => {
    const container = schemaWithBodyToDraftContainer(parallelParent({}));

    expect(onlyContainers(container.children)).toHaveLength(2);
    expect(container.arrangement).toBeUndefined();
    expect(container.interleaveOrder).toBeUndefined();
  });

  it("copies a stored interleaveOrder onto the draft container", () => {
    const container = schemaWithBodyToDraftContainer(
      parallelParent({ interleaveOrder: "track_by_track" }),
    );

    expect(container.interleaveOrder).toBe("track_by_track");
  });
});

describe("schemaWithBodyToDraftContainer round-trips stored compositions through emission", () => {
  it("re-emits an empty parallel-parent composition as exactly {}", () => {
    const draft = schemaWithBodyToDraftContainer(parallelParent({}));

    expect(composeContainerToComposition(draft)).toEqual({});
  });

  it("re-emits a stored interleaveOrder byte-for-byte", () => {
    const stored: Composition = { interleaveOrder: "track_by_track" };

    const draft = schemaWithBodyToDraftContainer(parallelParent(stored));

    expect(composeContainerToComposition(draft)).toEqual(stored);
  });

  it("round-trips a stranded interleaveOrder on a flat node untouched", () => {
    const stored: Composition = {
      repetition: { kind: "count", count: 5 },
      interleaveOrder: "track_by_track",
    };

    const draft = schemaWithBodyToDraftContainer(schema(TOP_ID, stored, [], []));

    expect(composeContainerToComposition(draft)).toEqual(stored);
  });
});
