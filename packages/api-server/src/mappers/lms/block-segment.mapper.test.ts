import {
  type BlockSegment as PrismaBlockSegment,
  SchemeArchetypeKind as PrismaSchemeArchetypeKind,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToBlockSegment } from "./block-segment.mapper";

const makeRow = (overrides: Partial<PrismaBlockSegment> = {}): PrismaBlockSegment => ({
  id: "cls_seg_1",
  blockId: "cls_block_1",
  order: 0,
  label: null,
  archetypeKind: PrismaSchemeArchetypeKind.COUNT_DOWN,
  schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
  schemeTemplateId: null,
  restConfig: null,
  version: 1,
  ...overrides,
});

describe("mapToBlockSegment", () => {
  it("maps a valid COUNT_DOWN segment with no rest config", () => {
    const result = mapToBlockSegment(makeRow());

    expect(result).toEqual({
      id: "cls_seg_1",
      blockId: "cls_block_1",
      order: 0,
      label: null,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
      schemeTemplateId: null,
      restConfig: null,
      version: 1,
    });
  });

  it("parses a valid restConfig FIXED", () => {
    const result = mapToBlockSegment(makeRow({ restConfig: { kind: "FIXED", seconds: 90 } }));

    expect(result.restConfig).toEqual({ kind: "FIXED", seconds: 90 });
  });

  it("exposes version on output", () => {
    const result = mapToBlockSegment(makeRow({ version: 7 }));

    expect(result.version).toBe(7);
  });

  it("rejects schemeParams with unknown kind", () => {
    const row = makeRow({
      archetypeKind: PrismaSchemeArchetypeKind.EMOM_LOOP,
      schemeParams: { kind: "NOT_A_REAL_KIND" },
    });

    expect(() => mapToBlockSegment(row)).toThrow();
  });

  it("rejects schemeParams missing required fields", () => {
    const row = makeRow({
      archetypeKind: PrismaSchemeArchetypeKind.COUNT_DOWN,
      schemeParams: { kind: "COUNT_DOWN" },
    });

    expect(() => mapToBlockSegment(row)).toThrow();
  });

  it("rejects malformed restConfig", () => {
    const row = makeRow({ restConfig: { kind: "FIXED" } });

    expect(() => mapToBlockSegment(row)).toThrow();
  });
});
