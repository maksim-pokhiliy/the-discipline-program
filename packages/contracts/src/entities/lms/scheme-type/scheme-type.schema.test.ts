import { describe, expect, it } from "vitest";

import { defaultSchemeParams } from "../_domain/scheme-archetype.constants";

import { createSchemeTypeSchema, updateSchemeTypeSchema } from "./scheme-type.schema";

const KIND_MISMATCH_MESSAGE = "defaultParams.kind must match archetypeKind";

describe("createSchemeTypeSchema kind-match refine", () => {
  it("accepts a payload whose defaultParams.kind matches archetypeKind", () => {
    const result = createSchemeTypeSchema.safeParse({
      name: "20-min EMOM",
      archetypeKind: "EMOM_LOOP",
      defaultParams: defaultSchemeParams("EMOM_LOOP"),
    });

    expect(result.success).toBe(true);
  });

  it("accepts a payload with archetypeKind=NONE and no defaultParams", () => {
    const result = createSchemeTypeSchema.safeParse({
      name: "Plain block",
      archetypeKind: "NONE",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a payload with mismatched archetypeKind=NONE because defaultParams is omitted", () => {
    const result = createSchemeTypeSchema.safeParse({
      name: "Plain block",
      archetypeKind: "COUNT_DOWN",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when defaultParams.kind does not match archetypeKind", () => {
    const result = createSchemeTypeSchema.safeParse({
      name: "Mismatched scheme",
      archetypeKind: "EMOM_LOOP",
      defaultParams: defaultSchemeParams("COUNT_DOWN"),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (current) => current.message === KIND_MISMATCH_MESSAGE,
      );

      expect(issue).toBeDefined();
      expect(issue?.path).toEqual(["defaultParams"]);
    }
  });

  it("rejects when archetypeKind is missing entirely (required field)", () => {
    const result = createSchemeTypeSchema.safeParse({
      name: "No archetype",
      defaultParams: defaultSchemeParams("NONE"),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const archetypeIssue = result.error.issues.find((issue) =>
        issue.path.includes("archetypeKind"),
      );

      expect(archetypeIssue).toBeDefined();
    }
  });
});

describe("updateSchemeTypeSchema kind-match refine", () => {
  it("accepts a partial payload that updates only the name", () => {
    const result = updateSchemeTypeSchema.safeParse({ name: "Renamed" });

    expect(result.success).toBe(true);
  });

  it("accepts a partial update that swaps archetypeKind without sending defaultParams", () => {
    const result = updateSchemeTypeSchema.safeParse({ archetypeKind: "INTERVAL_LOOP" });

    expect(result.success).toBe(true);
  });

  it("accepts a partial update that swaps both fields atomically and they match", () => {
    const result = updateSchemeTypeSchema.safeParse({
      archetypeKind: "LADDER",
      defaultParams: defaultSchemeParams("LADDER"),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a partial update with mismatched archetypeKind and defaultParams", () => {
    const result = updateSchemeTypeSchema.safeParse({
      archetypeKind: "DISTANCE",
      defaultParams: defaultSchemeParams("LADDER"),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (current) => current.message === KIND_MISMATCH_MESSAGE,
      );

      expect(issue).toBeDefined();
      expect(issue?.path).toEqual(["defaultParams"]);
    }
  });
});
