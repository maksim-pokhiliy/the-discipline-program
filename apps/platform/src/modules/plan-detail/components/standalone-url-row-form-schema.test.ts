import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { parseRowPayload } from "./row-form-utils";
import { toStandaloneUrlValue } from "./standalone-url-row-payload-form";

const isFieldError = (node: unknown): node is FieldError =>
  typeof node === "object" && node !== null && "message" in node;

const readMessage = (node: unknown): string | undefined => {
  if (isFieldError(node) && typeof node.message === "string") {
    return node.message;
  }

  return undefined;
};

const baseSchemaRow = {
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
  schemaId: "ckxw5p7gp0000q1mnzv5cuq0b",
  order: 1,
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
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} as const;

const standaloneUrlRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "STANDALONE_URL",
  rowPayload: {
    rowKind: "STANDALONE_URL",
    url: "https://youtu.be/abc123",
    wrapped: false,
    appliesTo: "whole_schema",
  },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("parseRowPayload for STANDALONE_URL", () => {
  it("accepts a valid url with a wrapped flag and a valid appliesTo", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://www.youtube.com/watch?v=abc",
      wrapped: true,
      appliesTo: "whole_schema",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({
        rowKind: "STANDALONE_URL",
        url: "https://www.youtube.com/watch?v=abc",
        wrapped: true,
        appliesTo: "whole_schema",
      });
    }
  });

  it("rejects a missing wrapped flag at path wrapped", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.wrapped)).toBeDefined();
    }
  });

  it("rejects a non-boolean wrapped flag at path wrapped", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      wrapped: "yes",
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.wrapped)).toBeDefined();
    }
  });

  it("rejects a non-url string at path url", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "not a url",
      wrapped: true,
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.url)).toBeDefined();
    }
  });

  it("rejects an empty url at path url", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "",
      wrapped: true,
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.url)).toBeDefined();
    }
  });

  it("rejects an unknown appliesTo at path appliesTo", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      wrapped: true,
      appliesTo: "anywhere",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.appliesTo)).toBeDefined();
    }
  });
});

describe("toStandaloneUrlValue", () => {
  it("returns an empty url, wrapped true and the default appliesTo in create mode", () => {
    const result = toStandaloneUrlValue({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "STANDALONE_URL",
    });

    expect(result).toEqual({ url: "", wrapped: true, appliesTo: "previous_exercise_row" });
  });

  it("carries the row's url, wrapped and appliesTo when editing a STANDALONE_URL row", () => {
    const result = toStandaloneUrlValue({ kind: "edit", row: standaloneUrlRow });

    expect(result).toEqual({
      url: "https://youtu.be/abc123",
      wrapped: false,
      appliesTo: "whole_schema",
    });
    expect(result.wrapped).toBe(false);
  });

  it("falls back to the create default when editing a non-STANDALONE_URL row", () => {
    const result = toStandaloneUrlValue({ kind: "edit", row: restSlotRow });

    expect(result).toEqual({ url: "", wrapped: true, appliesTo: "previous_exercise_row" });
  });
});
