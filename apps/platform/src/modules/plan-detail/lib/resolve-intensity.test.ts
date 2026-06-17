import { describe, expect, it } from "vitest";

import type { Intensity } from "@repo/contracts/lms/_shared";

import { resolveIntensity } from "./resolve-intensity";

describe("resolveIntensity", () => {
  it("returns an empty resolution when every level is null", () => {
    expect(resolveIntensity(null, null, null)).toEqual({ effective: null, provenance: {} });
  });

  it("returns an empty resolution when no level sets any dimension", () => {
    expect(resolveIntensity({}, {}, {})).toEqual({ effective: null, provenance: {} });
  });

  it("attributes a block-only dimension to the block", () => {
    const block: Intensity = { effortPercent: { value: 85 } };

    const resolved = resolveIntensity(block, null, null);

    expect(resolved.effective).toEqual({ effortPercent: { value: 85 } });
    expect(resolved.provenance).toEqual({ effortPercent: "block" });
  });

  it("lets the schema override the block for the same dimension", () => {
    const block: Intensity = { effortPercent: { value: 85 } };
    const schema: Intensity = { effortPercent: { value: 90 } };

    const resolved = resolveIntensity(block, schema, null);

    expect(resolved.effective).toEqual({ effortPercent: { value: 90 } });
    expect(resolved.provenance).toEqual({ effortPercent: "schema" });
  });

  it("lets the row win over schema and block per dimension (row > schema > block)", () => {
    const block: Intensity = { effortPercent: { value: 85 } };
    const schema: Intensity = { effortPercent: { value: 90 } };
    const row: Intensity = { effortPercent: { value: 95 } };

    const resolved = resolveIntensity(block, schema, row);

    expect(resolved.effective).toEqual({ effortPercent: { value: 95 } });
    expect(resolved.provenance).toEqual({ effortPercent: "row" });
  });

  it("merges dimensions partially: a row-only rpe inherits the block effort", () => {
    const block: Intensity = { effortPercent: { value: 85 } };
    const row: Intensity = { rpe: { value: 8 } };

    const resolved = resolveIntensity(block, null, row);

    expect(resolved.effective).toEqual({ effortPercent: { value: 85 }, rpe: { value: 8 } });
    expect(resolved.provenance).toEqual({ effortPercent: "block", rpe: "row" });
  });

  it("resolves each dimension to its own nearest level independently", () => {
    const block: Intensity = { effortPercent: { value: 85 }, hrZone: { zone: "Z2" } };
    const schema: Intensity = { hrZone: { zone: "Z3" } };
    const row: Intensity = { rpe: { value: 9 } };

    const resolved = resolveIntensity(block, schema, row);

    expect(resolved.effective).toEqual({
      effortPercent: { value: 85 },
      rpe: { value: 9 },
      hrZone: { zone: "Z3" },
    });
    expect(resolved.provenance).toEqual({
      effortPercent: "block",
      rpe: "row",
      hrZone: "schema",
    });
  });
});
