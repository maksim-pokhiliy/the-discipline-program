import { describe, expect, it } from "vitest";

import { profileSelectionsSchema } from "@repo/contracts/coaching/athlete-profile";

import { classifyKey, reKeyProfileSelections } from "./profile-selections-rekey";

const REAL_AXIS_ID = "cmqrp2xdy0000sot4u5l3z5wq";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const CREATED_AXIS_ID = "clz00000000000000000axs01";

describe("classifyKey", () => {
  it("classifies a real 25-char cuid axis id as cuid", () => {
    expect(classifyKey(REAL_AXIS_ID)).toBe("cuid");
    expect(classifyKey(SYSTEM_GENDER_AXIS_ID)).toBe("cuid");
  });

  it("classifies c-prefixed mixed-case axis names as name, not cuid (QA-301)", () => {
    expect(classifyKey("Conditioning")).toBe("name");
    expect(classifyKey("Competition")).toBe("name");
    expect(classifyKey("company")).toBe("name");
  });

  it("classifies the gender tokens as gender, case-insensitively", () => {
    expect(classifyKey("gender")).toBe("gender");
    expect(classifyKey("Sex")).toBe("gender");
    expect(classifyKey("SEX")).toBe("gender");
  });
});

describe("reKeyProfileSelections", () => {
  it("keeps a cuid key unchanged (idempotent re-run)", () => {
    const result = reKeyProfileSelections({ [REAL_AXIS_ID]: "RX" }, true, {});

    expect(result.next).toEqual({ [REAL_AXIS_ID]: "RX" });
    expect(result.drops).toEqual([]);
    expect(result.flags).toEqual([]);
  });

  it("drops a gender key when the typed gender is set", () => {
    const result = reKeyProfileSelections({ gender: "Male" }, true, {});

    expect(result.drops).toEqual(["gender"]);
    expect(result.flags).toEqual([]);
    expect(result.next).toEqual({});
  });

  it("flags a gender key when the typed gender is unset, never dropping it (#309 guard)", () => {
    const result = reKeyProfileSelections({ gender: "Male" }, false, {});

    expect(result.flags).toEqual(["gender"]);
    expect(result.drops).toEqual([]);
    expect(result.next).toEqual({});
  });

  it("re-keys a c-prefixed name to its catalog axis id, preserving the value (QA-301)", () => {
    const result = reKeyProfileSelections({ Conditioning: "Metcon" }, true, {
      Conditioning: CREATED_AXIS_ID,
    });

    expect(result.next).toEqual({ [CREATED_AXIS_ID]: "Metcon" });
    expect(result.drops).toEqual([]);
    expect(result.flags).toEqual([]);
  });

  it("flags a name absent from the axis-id map instead of silently losing it", () => {
    const result = reKeyProfileSelections({ Conditioning: "Metcon" }, true, {});

    expect(result.flags).toEqual(["Conditioning"]);
    expect(result.next).toEqual({});
    expect(result.drops).toEqual([]);
  });

  it("flags both name keys that collide on one target axis id, keeping neither (no silent loss)", () => {
    const result = reKeyProfileSelections({ Goal: "a", "Goal ": "b" }, true, {
      Goal: CREATED_AXIS_ID,
    });

    expect([...result.flags].sort()).toEqual(["Goal", "Goal "].sort());
    expect(result.next).toEqual({});
    expect(result.drops).toEqual([]);
  });

  it("flags a cuid key and a name that both resolve to the same axis id", () => {
    const result = reKeyProfileSelections({ [CREATED_AXIS_ID]: "a", Conditioning: "b" }, true, {
      Conditioning: CREATED_AXIS_ID,
    });

    expect([...result.flags].sort()).toEqual([CREATED_AXIS_ID, "Conditioning"].sort());
    expect(result.next).toEqual({});
  });

  it("produces a map that passes the strict profileSelectionsSchema", () => {
    const result = reKeyProfileSelections(
      { [REAL_AXIS_ID]: "RX", Conditioning: "Metcon", gender: "Male" },
      true,
      { Conditioning: CREATED_AXIS_ID },
    );

    expect(result.next).toEqual({ [REAL_AXIS_ID]: "RX", [CREATED_AXIS_ID]: "Metcon" });
    expect(profileSelectionsSchema.safeParse(result.next).success).toBe(true);
  });
});
