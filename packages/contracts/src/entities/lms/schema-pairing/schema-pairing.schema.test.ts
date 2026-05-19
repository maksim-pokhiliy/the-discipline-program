import { describe, expect, it } from "vitest";

import { SCHEMA_PAIRING_RELATIONS } from "./schema-pairing.constants";
import {
  createSchemaPairingSchema,
  schemaPairingRelationSchema,
  schemaPairingSchema,
} from "./schema-pairing.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

describe("schemaPairingRelationSchema", () => {
  for (const r of SCHEMA_PAIRING_RELATIONS) {
    it(`accepts SchemaPairingRelation "${r}"`, () => {
      expect(schemaPairingRelationSchema.safeParse(r).success).toBe(true);
    });
  }

  it("rejects unknown relation", () => {
    expect(schemaPairingRelationSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it("exposes a single canonical value (Phase 5 catalog)", () => {
    expect(SCHEMA_PAIRING_RELATIONS).toEqual(["ALTERNATING_SETS"]);
  });
});

describe("schemaPairingSchema", () => {
  it("accepts a fully-populated pairing", () => {
    const r = schemaPairingSchema.safeParse({
      id: cuidA,
      schemaAId: cuidB,
      schemaBId: cuidC,
      relationKind: "ALTERNATING_SETS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(true);
  });

  it("rejects missing field", () => {
    const r = schemaPairingSchema.safeParse({
      id: cuidA,
      schemaAId: cuidB,
      schemaBId: cuidC,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(false);
  });

  it("rejects non-cuid id", () => {
    const r = schemaPairingSchema.safeParse({
      id: "not-a-cuid",
      schemaAId: cuidB,
      schemaBId: cuidC,
      relationKind: "ALTERNATING_SETS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(r.success).toBe(false);
  });
});

describe("createSchemaPairingSchema", () => {
  it("accepts distinct schemaA/B with relation", () => {
    expect(
      createSchemaPairingSchema.safeParse({
        schemaAId: cuidA,
        schemaBId: cuidB,
        relationKind: "ALTERNATING_SETS",
      }).success,
    ).toBe(true);
  });

  it("rejects schemaAId === schemaBId", () => {
    const r = createSchemaPairingSchema.safeParse({
      schemaAId: cuidA,
      schemaBId: cuidA,
      relationKind: "ALTERNATING_SETS",
    });

    expect(r.success).toBe(false);

    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe("schemaAId and schemaBId must be different");
    }
  });

  it("rejects unknown relationKind", () => {
    expect(
      createSchemaPairingSchema.safeParse({
        schemaAId: cuidA,
        schemaBId: cuidB,
        relationKind: "UNKNOWN",
      }).success,
    ).toBe(false);
  });
});
