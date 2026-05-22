import { describe, expect, it } from "vitest";

import type { Load } from "@repo/contracts/lms/_shared";
import { ROW_KINDS, type RowKind, type SchemaRow } from "@repo/contracts/lms/schema-row";

import { ROW_KIND_FORM_REGISTRY } from "./row-kind-form-registry";
import { standaloneLoadRowFormSchema, toFormData } from "./standalone-load-row-form";

const issuePaths = (data: unknown): string[] => {
  const result = standaloneLoadRowFormSchema.safeParse(data);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join("."));
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

describe("standaloneLoadRowFormSchema", () => {
  it("rejects a percentage load with rangeMax < value at path load.rangeMax (QA-#10, T24)", () => {
    const paths = issuePaths({
      load: { kind: "percentage", value: 70, rangeMax: 60, reference: { scope: "self" } },
    });

    expect(paths).toContain("load.rangeMax");
  });

  it("rejects a percentage load with rangeMax === value at path load.rangeMax (QA-#10, T24)", () => {
    const paths = issuePaths({
      load: { kind: "percentage", value: 70, rangeMax: 70, reference: { scope: "self" } },
    });

    expect(paths).toContain("load.rangeMax");
  });

  it("accepts a percentage load with rangeMax > value (QA-#10, T24)", () => {
    const result = standaloneLoadRowFormSchema.safeParse({
      load: { kind: "percentage", value: 70, rangeMax: 80, reference: { scope: "self" } },
    });

    expect(result.success).toBe(true);
  });

  it("accepts a percentage load with no rangeMax (QA-#10, T24)", () => {
    const result = standaloneLoadRowFormSchema.safeParse({
      load: { kind: "percentage", value: 70, reference: { scope: "self" } },
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid absolute load (QA-#10, T24)", () => {
    const result = standaloneLoadRowFormSchema.safeParse({
      load: { kind: "absolute", weight: { variant: "single", valueKg: 32 } },
    });

    expect(result.success).toBe(true);
  });

  it("rejects valueKg of 0 at path load.weight.valueKg (QA-#11, T24)", () => {
    const paths = issuePaths({
      load: { kind: "absolute", weight: { variant: "single", valueKg: 0 } },
    });

    expect(paths).toContain("load.weight.valueKg");
  });

  it("rejects valueKg of NaN at path load.weight.valueKg (QA-#11, T24)", () => {
    const paths = issuePaths({
      load: { kind: "absolute", weight: { variant: "single", valueKg: Number.NaN } },
    });

    expect(paths).toContain("load.weight.valueKg");
  });

  it("rejects a percentage value above 200 at path load.value (QA-#12, T24)", () => {
    const paths = issuePaths({
      load: { kind: "percentage", value: 250, reference: { scope: "self" } },
    });

    expect(paths).toContain("load.value");
  });

  it("accepts a percentage value of 0 — contract permits it (QA-#12, QA-301, T24)", () => {
    const result = standaloneLoadRowFormSchema.safeParse({
      load: { kind: "percentage", value: 0, reference: { scope: "self" } },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty movementFamily at path load.reference.movementFamily (QA-#13, T24)", () => {
    const paths = issuePaths({
      load: {
        kind: "percentage",
        value: 60,
        reference: { scope: "movement_family", movementFamily: "" },
      },
    });

    expect(paths).toContain("load.reference.movementFamily");
  });
});

const IMPLEMENTED_KINDS: readonly RowKind[] = [
  "STANDALONE_LOAD",
  "REST",
  "INNER_LADDER_MARKER",
  "STANDALONE_URL",
];

describe("ROW_KIND_FORM_REGISTRY", () => {
  it("registers the 4 implemented row kinds (QA-#14, T24)", () => {
    for (const kind of IMPLEMENTED_KINDS) {
      expect(ROW_KIND_FORM_REGISTRY[kind]).not.toBeUndefined();
    }
  });

  it("misses the 5 unimplemented row kinds (QA-#14, T24)", () => {
    const unimplementedKinds = ROW_KINDS.filter((kind) => !IMPLEMENTED_KINDS.includes(kind));

    for (const kind of unimplementedKinds) {
      expect(ROW_KIND_FORM_REGISTRY[kind]).toBeUndefined();
    }
  });
});

describe("toFormData", () => {
  it("returns the absolute single default in create mode (QA-#15, T24)", () => {
    const result = toFormData({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "STANDALONE_LOAD",
    });

    expect(result.load).toEqual({ kind: "absolute", weight: { variant: "single", valueKg: 15 } });
  });

  it("returns the row's rowPayload load when editing a STANDALONE_LOAD row (QA-#15, T24)", () => {
    const result = toFormData({ kind: "edit", row: standaloneLoadRow });

    expect(result.load).toEqual(standaloneLoad);
  });

  it("falls back to the absolute default when editing a non-STANDALONE_LOAD row (QA-#15, T24)", () => {
    const result = toFormData({ kind: "edit", row: restSlotRow });

    expect(result.load).toEqual({ kind: "absolute", weight: { variant: "single", valueKg: 15 } });
  });
});
