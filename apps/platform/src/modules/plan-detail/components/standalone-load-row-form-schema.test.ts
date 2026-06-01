import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { Load } from "@repo/contracts/lms/_shared";
import { type RowKind, type SchemaRow } from "@repo/contracts/lms/schema-row";

import { parseRowPayload } from "./row-form-utils";
import { ROW_PAYLOAD_FORM_REGISTRY } from "./row-payload-form-registry";
import { toStandaloneLoadValue } from "./standalone-load-row-payload-form";

const SCOPE = "applies_to_all_preceding_rows";

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

const standaloneLoad: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

const standaloneLoadRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "STANDALONE_LOAD",
  rowPayload: {
    rowKind: "STANDALONE_LOAD",
    load: standaloneLoad,
    scope: "applies_to_all_preceding_rows",
  },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("parseRowPayload for STANDALONE_LOAD", () => {
  it("rejects a percentage load with rangeMax < value at the load root (contract superRefine has no path)", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 70, rangeMax: 60, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "root"))).toBe(
        "percentage.rangeMax must be > value when set",
      );
    }
  });

  it("rejects a percentage load with rangeMax === value at the load root", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 70, rangeMax: 70, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "root"))).toBe(
        "percentage.rangeMax must be > value when set",
      );
    }
  });

  it("accepts a percentage load with rangeMax > value", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 70, rangeMax: 80, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts a percentage load with no rangeMax", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 70, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts a valid absolute load", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "absolute", weight: { variant: "single", valueKg: 32 } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects valueKg of 0 at path load.weight.valueKg", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "absolute", weight: { variant: "single", valueKg: 0 } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const weight = readBranch(result.error.load, "weight");

      expect(readMessage(readBranch(weight, "valueKg"))).toBe("Number must be greater than 0");
    }
  });

  it("rejects valueKg of NaN at path load.weight.valueKg", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "absolute", weight: { variant: "single", valueKg: Number.NaN } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const weight = readBranch(result.error.load, "weight");

      expect(readMessage(readBranch(weight, "valueKg"))).toBeDefined();
    }
  });

  it("rejects a percentage value above 200 at path load.value", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 250, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "value"))).toBe(
        "Number must be less than or equal to 200",
      );
    }
  });

  it("accepts a percentage value of 0 — contract permits it", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 0, reference: { scope: "self" } },
      scope: SCOPE,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an empty movementFamily at path load.reference.movementFamily", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: {
        kind: "percentage",
        value: 60,
        reference: { scope: "movement_family", movementFamily: "" },
      },
      scope: SCOPE,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const reference = readBranch(result.error.load, "reference");

      expect(readMessage(readBranch(reference, "movementFamily"))).toBeDefined();
    }
  });
});

const IMPLEMENTED_KINDS: readonly RowKind[] = [
  "EXERCISE",
  "STANDALONE_LOAD",
  "REST",
  "INNER_LADDER_MARKER",
  "STANDALONE_URL",
  "REST_SLOT",
  "FOOTNOTE",
  "PLACEHOLDER",
  "REP_DEFINITION",
];

describe("ROW_PAYLOAD_FORM_REGISTRY", () => {
  it("registers every one of the 9 row kinds including the un-deferred three", () => {
    for (const kind of IMPLEMENTED_KINDS) {
      expect(ROW_PAYLOAD_FORM_REGISTRY[kind]).toBeDefined();
    }
  });
});

describe("toStandaloneLoadValue", () => {
  it("returns the absolute single default and empty notes in create mode", () => {
    const result = toStandaloneLoadValue({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "STANDALONE_LOAD",
    });

    expect(result.load).toEqual({ kind: "absolute", weight: { variant: "single", valueKg: 15 } });
    expect(result.notes).toBe("");
  });

  it("returns the row's rowPayload load and notes when editing a STANDALONE_LOAD row", () => {
    const result = toStandaloneLoadValue({
      kind: "edit",
      row: { ...standaloneLoadRow, notes: "heavy day" },
    });

    expect(result.load).toEqual(standaloneLoad);
    expect(result.notes).toBe("heavy day");
  });

  it("falls back to the absolute default when editing a non-STANDALONE_LOAD row", () => {
    const result = toStandaloneLoadValue({ kind: "edit", row: restSlotRow });

    expect(result.load).toEqual({ kind: "absolute", weight: { variant: "single", valueKg: 15 } });
  });
});
