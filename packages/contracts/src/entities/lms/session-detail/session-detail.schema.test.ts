import { describe, expect, it } from "vitest";

import { resolvedLoadSchema, resolvedLoadSourceSchema } from "./session-detail.schema";

const CUID = "ck1234567890123456789012";
const OTHER_CUID = "ck2234567890123456789012";

const profileSource = {
  kind: "profile",
  coords: [
    { axisId: CUID, label: "Level", value: "RX", binding: null },
    { axisId: OTHER_CUID, label: "Gender", value: "Female", binding: "GENDER" },
  ],
};

const oneRMSource = {
  kind: "one_rm",
  exerciseId: CUID,
  percent: 70,
  baseKg: 120,
  recordedAt: "2026-07-12T10:00:00.000Z",
  recordSource: "MANUAL",
};

describe("resolvedLoadSchema — the source additive", () => {
  it("still parses a resolved arm with no source at all (D-A: a pre-deploy cache degrades, it does not throw)", () => {
    expect(
      resolvedLoadSchema.safeParse({ status: "resolved", kg: 40, perHand: false }).success,
    ).toBe(true);
  });

  it("parses a resolved arm carrying a profile source", () => {
    expect(
      resolvedLoadSchema.safeParse({
        status: "resolved",
        kg: 50,
        perHand: false,
        source: profileSource,
      }).success,
    ).toBe(true);
  });

  it("parses a resolved arm carrying a one_rm source", () => {
    expect(
      resolvedLoadSchema.safeParse({
        status: "resolved",
        kg: 84,
        perHand: false,
        source: oneRMSource,
      }).success,
    ).toBe(true);
  });

  it("leaves every other arm free of a source (D-A: absence is the client's discriminator)", () => {
    expect(resolvedLoadSchema.safeParse({ status: "bodyweight" }).success).toBe(true);
    expect(resolvedLoadSchema.safeParse({ status: "not_applicable" }).success).toBe(true);
  });
});

describe("resolvedLoadSourceSchema — the profile arm", () => {
  it("accepts a coordinate bound to GENDER and one bound to nothing", () => {
    expect(resolvedLoadSourceSchema.safeParse(profileSource).success).toBe(true);
  });

  it("rejects a binding that is neither GENDER nor null", () => {
    expect(
      resolvedLoadSourceSchema.safeParse({
        kind: "profile",
        coords: [{ axisId: CUID, label: "Level", value: "RX", binding: "AGE" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty coordinate list — a profile source always names at least one axis", () => {
    expect(resolvedLoadSourceSchema.safeParse({ kind: "profile", coords: [] }).success).toBe(false);
  });
});

describe("resolvedLoadSourceSchema — the one_rm arm", () => {
  it("treats percentMax as optional (D-G: only a ranged percentage carries it)", () => {
    expect(resolvedLoadSourceSchema.safeParse(oneRMSource).success).toBe(true);
    expect(resolvedLoadSourceSchema.safeParse({ ...oneRMSource, percentMax: 80 }).success).toBe(
      true,
    );
  });

  it("rejects a recordedAt that is not an ISO instant", () => {
    expect(
      resolvedLoadSourceSchema.safeParse({ ...oneRMSource, recordedAt: "2026-07-12" }).success,
    ).toBe(false);
  });

  it("rejects a recordSource outside the OneRMRecordSource enum", () => {
    expect(
      resolvedLoadSourceSchema.safeParse({ ...oneRMSource, recordSource: "GUESSED" }).success,
    ).toBe(false);
  });
});
