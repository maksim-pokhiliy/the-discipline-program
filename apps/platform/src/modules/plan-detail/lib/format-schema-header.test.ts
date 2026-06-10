import { describe, expect, it } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { formatSchemaHeader } from "./format-schema-header";

const now = new Date("2025-01-06T00:00:00Z");

const DEFAULT_SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const DEFAULT_BLOCK_ID = "clp9z8x7w0000abcd1234blk1";

const makeSchema = (
  overrides: Partial<SchemaWithBody["schema"]> = {},
  subSchemas: SchemaWithBody[] = [],
): SchemaWithBody => ({
  schema: {
    id: DEFAULT_SCHEMA_ID,
    blockId: DEFAULT_BLOCK_ID,
    parentSchemaId: null,
    order: 10,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  },
  rows: [],
  subSchemas,
});

const makeLadderTracks = (): SchemaWithBody[] => [
  makeSchema({ composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } } }),
  makeSchema({ composition: { repetition: { kind: "ladder", steps: [15, 12, 9] } } }),
];

describe("formatSchemaHeader", () => {
  it("returns the persisted header verbatim when non-null and non-empty", () => {
    const schema = makeSchema({
      header: "Coach-authored title",
      composition: { repetition: { kind: "count", count: 5 } },
    });

    expect(formatSchemaHeader(schema)).toBe("Coach-authored title");
  });

  it("derives an EMOM header from a cadence composition when the header is empty", () => {
    const schema = makeSchema({
      header: "",
      composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 4 } },
    });

    expect(formatSchemaHeader(schema)).toBe("EMOM 1’×4");
  });

  it("derives a rounds header from a count composition", () => {
    const schema = makeSchema({
      composition: { repetition: { kind: "count", count: 5 } },
    });

    expect(formatSchemaHeader(schema)).toBe("5 rounds");
  });

  it("derives a ladder header from a ladder composition", () => {
    const schema = makeSchema({
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
    });

    expect(formatSchemaHeader(schema)).toBe("ladder 21-15-9");
  });

  it("returns an empty string for a composition-only schema with no axes", () => {
    const schema = makeSchema({ composition: {} });

    expect(formatSchemaHeader(schema)).toBe("");
  });

  it("falls back to the parallel title with the default interleave order for a headerless structural parallel", () => {
    const schema = makeSchema({ composition: {} }, makeLadderTracks());

    expect(formatSchemaHeader(schema)).toBe("parallel (round by round)");
  });

  it("folds a stored interleave order into the parallel fallback title", () => {
    const schema = makeSchema(
      { composition: { interleaveOrder: "track_by_track" } },
      makeLadderTracks(),
    );

    expect(formatSchemaHeader(schema)).toBe("parallel (track by track)");
  });

  it("prefers the persisted header over the parallel derivation", () => {
    const schema = makeSchema({ composition: {}, header: "Conditioning A/B" }, makeLadderTracks());

    expect(formatSchemaHeader(schema)).toBe("Conditioning A/B");
  });

  it("returns an empty string when both header and composition are absent", () => {
    const schema = makeSchema();

    expect(formatSchemaHeader(schema)).toBe("");
  });

  it("derives the header from the structural repetition axis", () => {
    const schema = makeSchema({
      composition: { repetition: { kind: "count", count: 5 } },
    });

    expect(formatSchemaHeader(schema)).toBe("5 rounds");
  });
});
