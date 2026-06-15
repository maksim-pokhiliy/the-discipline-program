import { describe, expect, it } from "vitest";

import { duplicateBlockRequestSchema } from "./block";
import { cloneDayFromRequestSchema, cloneDayResponseSchema } from "./day";
import { duplicateSchemaRequestSchema } from "./schema";
import { duplicateSchemaRowRequestSchema } from "./schema-row";
import { duplicateSessionRequestSchema } from "./session";
import { cloneWeekFromRequestSchema, cloneWeekResponseSchema } from "./week";

const VALID_DATE = "2026-01-05";

describe("duplicate request schemas", () => {
  const schemas = {
    session: duplicateSessionRequestSchema,
    block: duplicateBlockRequestSchema,
    schema: duplicateSchemaRequestSchema,
    row: duplicateSchemaRowRequestSchema,
  } as const;

  for (const [floor, schema] of Object.entries(schemas)) {
    it(`accepts an empty body for ${floor} (MT-11)`, () => {
      expect(schema.parse({})).toEqual({});
    });

    it(`rejects a stray field for ${floor} (MT-11)`, () => {
      expect(() => schema.parse({ foo: 1 })).toThrow();
    });
  }
});

describe("cloneWeekFromRequestSchema (MT-11)", () => {
  it("accepts a well-formed sourceStartDate", () => {
    expect(cloneWeekFromRequestSchema.parse({ sourceStartDate: VALID_DATE })).toEqual({
      sourceStartDate: VALID_DATE,
    });
  });

  it("rejects a missing sourceStartDate", () => {
    expect(() => cloneWeekFromRequestSchema.parse({})).toThrow();
  });

  it("rejects a malformed sourceStartDate shape", () => {
    expect(() => cloneWeekFromRequestSchema.parse({ sourceStartDate: "05-01-2026" })).toThrow();
  });
});

describe("cloneDayFromRequestSchema (MT-11)", () => {
  it("accepts a well-formed source slot", () => {
    expect(
      cloneDayFromRequestSchema.parse({ sourceStartDate: VALID_DATE, sourceDayOfWeek: "MONDAY" }),
    ).toEqual({ sourceStartDate: VALID_DATE, sourceDayOfWeek: "MONDAY" });
  });

  it("rejects an out-of-enum sourceDayOfWeek", () => {
    expect(() =>
      cloneDayFromRequestSchema.parse({ sourceStartDate: VALID_DATE, sourceDayOfWeek: "FUNDAY" }),
    ).toThrow();
  });
});

describe("clone response unions (MT-2 / D-A)", () => {
  it("accepts the empty-source arm on the week union", () => {
    expect(cloneWeekResponseSchema.parse({ cloned: false, reason: "empty-source" })).toEqual({
      cloned: false,
      reason: "empty-source",
    });
  });

  it("rejects a cloned:true arm without the week payload", () => {
    expect(() => cloneWeekResponseSchema.parse({ cloned: true })).toThrow();
  });

  it("accepts the empty-source arm on the day union", () => {
    expect(cloneDayResponseSchema.parse({ cloned: false, reason: "empty-source" })).toEqual({
      cloned: false,
      reason: "empty-source",
    });
  });

  it("rejects an unknown reason on the empty-source arm", () => {
    expect(() => cloneWeekResponseSchema.parse({ cloned: false, reason: "whatever" })).toThrow();
  });
});
