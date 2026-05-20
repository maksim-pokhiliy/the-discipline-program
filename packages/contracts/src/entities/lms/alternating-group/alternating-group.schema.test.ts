import { describe, expect, it } from "vitest";

import { ALTERNATING_GROUP_RELATIONS } from "./alternating-group.constants";
import {
  alternatingGroupRelationSchema,
  alternatingGroupSchema,
  createAlternatingGroupSchema,
} from "./alternating-group.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

describe("alternatingGroupRelationSchema", () => {
  for (const r of ALTERNATING_GROUP_RELATIONS) {
    it(`accepts AlternatingGroupRelation "${r}"`, () => {
      expect(alternatingGroupRelationSchema.safeParse(r).success).toBe(true);
    });
  }

  it("rejects unknown relation", () => {
    expect(alternatingGroupRelationSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it("exposes a single canonical value (Phase 5 catalog)", () => {
    expect(ALTERNATING_GROUP_RELATIONS).toEqual(["ALTERNATING_SETS"]);
  });
});

describe("alternatingGroupSchema", () => {
  it("accepts a fully-populated group", () => {
    const r = alternatingGroupSchema.safeParse({
      id: cuidA,
      blockId: cuidB,
      relationKind: "ALTERNATING_SETS",
      schemaIds: [cuidB, cuidC],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(true);
  });

  it("rejects missing field", () => {
    const r = alternatingGroupSchema.safeParse({
      id: cuidA,
      blockId: cuidB,
      schemaIds: [cuidB, cuidC],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(false);
  });

  it("rejects non-cuid id", () => {
    const r = alternatingGroupSchema.safeParse({
      id: "not-a-cuid",
      blockId: cuidB,
      relationKind: "ALTERNATING_SETS",
      schemaIds: [cuidB, cuidC],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(false);
  });
});

describe("createAlternatingGroupSchema", () => {
  it("accepts two or more distinct schemaIds with relation", () => {
    expect(
      createAlternatingGroupSchema.safeParse({
        relationKind: "ALTERNATING_SETS",
        schemaIds: [cuidA, cuidB, cuidC],
      }).success,
    ).toBe(true);
  });

  it("rejects a single-element schemaIds array", () => {
    expect(
      createAlternatingGroupSchema.safeParse({
        relationKind: "ALTERNATING_SETS",
        schemaIds: [cuidA],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate schemaIds", () => {
    const r = createAlternatingGroupSchema.safeParse({
      relationKind: "ALTERNATING_SETS",
      schemaIds: [cuidA, cuidA],
    });

    expect(r.success).toBe(false);

    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe("schemaIds must be unique");
    }
  });

  it("rejects unknown relationKind", () => {
    expect(
      createAlternatingGroupSchema.safeParse({
        relationKind: "UNKNOWN",
        schemaIds: [cuidA, cuidB],
      }).success,
    ).toBe(false);
  });
});
