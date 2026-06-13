import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeRow } from "../components/axes/axis-draft.types";

import { composeContainerToComposition } from "./compose-container-to-composition";
import { schemaWithBodyToDraft } from "./schema-to-draft";

const EPOCH = new Date(0);
const TOP_ID = "cktop1234567890abcdef01234";
const ROW_ID = "ckrow1234567890abcdef01234";
const BLOCK_ID = "ckblk1234567890abcdef01234";
const EXERCISE_ID = "ckexr1234567890abcdef01234";

const exerciseRow = (id: string, schemaId: string): SchemaRow => ({
  id,
  schemaId,
  order: 1,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
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
  rowGroups: [],
});

const rowIds = (rows: ComposeRow[]): string[] => rows.map((row) => row.id);

describe("schemaWithBodyToDraft rebuilds the draft schema", () => {
  it("rebuilds the schema axes from the stored composition", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    };

    const draft = schemaWithBodyToDraft(schema(TOP_ID, composition, []));

    expect(draft.id).toBe(TOP_ID);
    expect(draft.repetition).toEqual({ kind: "count", count: 5 });
    expect(draft.rest).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });

  it("rebuilds direct rows carrying the persisted id", () => {
    const draft = schemaWithBodyToDraft(schema(TOP_ID, null, [exerciseRow(ROW_ID, TOP_ID)]));

    expect(rowIds(draft.rows)).toEqual([ROW_ID]);
  });

  it("leaves the schema axis-free when the stored composition is null", () => {
    const draft = schemaWithBodyToDraft(schema(TOP_ID, null, []));

    expect(draft.repetition).toBeUndefined();
    expect(draft.rest).toBeUndefined();
  });
});

describe("schemaWithBodyToDraft round-trips stored compositions through emission", () => {
  it("re-emits an empty composition as exactly {}", () => {
    const draft = schemaWithBodyToDraft(schema(TOP_ID, {}, []));

    expect(composeContainerToComposition(draft)).toEqual({});
  });

  it("re-emits a stored repetition + rest composition byte-for-byte", () => {
    const stored: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    };

    const draft = schemaWithBodyToDraft(schema(TOP_ID, stored, []));

    expect(composeContainerToComposition(draft)).toEqual(stored);
  });
});
