import { describe, expect, it } from "vitest";

import { ARCHETYPE_NAMES } from "../schema/schema.constants";

import { ARCHETYPE_CONSTANTS } from "./archetype.constants";
import { archetypeSchema } from "./archetype.schema";

const cuidA = "clz1234567890123456789aaa";

const baseArchetype = {
  id: cuidA,
  name: "n-rounds" as const,
  kind: "ATOMIC" as const,
  family: "ROUNDS_SETS" as const,
  headerPatternDescription: "N rounds of:",
  bodyLayoutDescription: "ordered exercise rows",
  archetypeParamsSchema: ["count", "rest"],
  relatedArchetypes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("archetypeSchema", () => {
  it("accepts a fully-populated archetype", () => {
    expect(archetypeSchema.safeParse(baseArchetype).success).toBe(true);
  });

  it("accepts all 34 archetype names (regression guard)", () => {
    for (const n of ARCHETYPE_NAMES) {
      const r = archetypeSchema.safeParse({ ...baseArchetype, name: n });

      expect(r.success).toBe(true);
    }
  });

  it("accepts opaque archetypeParamsSchema (z.unknown)", () => {
    expect(
      archetypeSchema.safeParse({
        ...baseArchetype,
        archetypeParamsSchema: { schemaShape: "internal-meta" },
      }).success,
    ).toBe(true);
  });

  it("accepts opaque relatedArchetypes (graph metadata)", () => {
    expect(
      archetypeSchema.safeParse({
        ...baseArchetype,
        relatedArchetypes: [{ to: "ladder-descending", kind: "specialization_of" }],
      }).success,
    ).toBe(true);
  });

  it("rejects headerPatternDescription beyond MAX length", () => {
    expect(
      archetypeSchema.safeParse({
        ...baseArchetype,
        headerPatternDescription: "x".repeat(ARCHETYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects unknown name", () => {
    expect(archetypeSchema.safeParse({ ...baseArchetype, name: "fake" }).success).toBe(false);
  });

  it("rejects unknown family", () => {
    expect(archetypeSchema.safeParse({ ...baseArchetype, family: "FAKE" }).success).toBe(false);
  });

  it("rejects lowercase kind", () => {
    expect(archetypeSchema.safeParse({ ...baseArchetype, kind: "atomic" }).success).toBe(false);
  });
});
