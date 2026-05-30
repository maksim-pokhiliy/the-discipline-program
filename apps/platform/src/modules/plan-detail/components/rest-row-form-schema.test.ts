import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { toRestValue } from "./rest-row-payload-form";
import { parseRowPayload } from "./row-form-utils";

const isFieldError = (node: unknown): node is FieldError =>
  typeof node === "object" && node !== null && "message" in node;

const readMessage = (node: unknown): string | undefined => {
  if (isFieldError(node) && typeof node.message === "string") {
    return node.message;
  }

  return undefined;
};

const readBranch = (node: unknown, key: string): unknown =>
  typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined;

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

const editedRestParsed = {
  duration: { value: 3, unit: "min" },
  scope: "between_rounds",
} as const;

const restRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST",
  rowPayload: {
    rowKind: "REST",
    raw: "rest 3 min between rounds",
    parsed: editedRestParsed,
  },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("parseRowPayload for REST", () => {
  it("accepts a valid parsed rest spec with a raw string", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      raw: "rest 90s between sets",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({
        rowKind: "REST",
        parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
        raw: "rest 90s between sets",
      });
    }
  });

  it("rejects a range_* duration with rangeMax <= value at the duration sub-path", () => {
    const result = parseRowPayload("REST", {
      parsed: {
        duration: { value: 90, unit: "range_sec", rangeMax: 60 },
        scope: "between_sets",
      },
      raw: "rest",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const duration = readBranch(result.error.parsed, "duration");

      expect(readMessage(readBranch(duration, "root"))).toBe(
        "rangeMax required when unit is range_*, must be > value; forbidden otherwise",
      );
    }
  });

  it("rejects a range_* duration with no rangeMax at the duration sub-path", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 90, unit: "range_sec" }, scope: "between_sets" },
      raw: "rest",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const duration = readBranch(result.error.parsed, "duration");

      expect(readMessage(readBranch(duration, "root"))).toBeDefined();
    }
  });

  it("rejects a non-positive duration value at path parsed.duration.value", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 0, unit: "sec" }, scope: "between_sets" },
      raw: "rest",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const duration = readBranch(result.error.parsed, "duration");

      expect(readMessage(readBranch(duration, "value"))).toBe("Number must be greater than 0");
    }
  });

  it("rejects a blank raw string at path raw", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      raw: "",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.raw)).toBeDefined();
    }
  });
});

describe("toRestValue", () => {
  it("returns the default rest spec, empty notes and empty raw in create mode", () => {
    const result = toRestValue({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "REST",
    });

    expect(result).toEqual({
      parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      notes: "",
      raw: "",
    });
  });

  it("returns the row's rowPayload parsed, raw and notes when editing a REST row", () => {
    const result = toRestValue({ kind: "edit", row: { ...restRow, notes: "warm up first" } });

    expect(result.parsed).toEqual(editedRestParsed);
    expect(result.raw).toBe("rest 3 min between rounds");
    expect(result.notes).toBe("warm up first");
  });

  it("coerces a null notes to an empty string when editing a REST row", () => {
    const result = toRestValue({ kind: "edit", row: restRow });

    expect(result.notes).toBe("");
  });

  it("falls back to the default rest spec when editing a non-REST row", () => {
    const result = toRestValue({ kind: "edit", row: restSlotRow });

    expect(result.parsed).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });
});
