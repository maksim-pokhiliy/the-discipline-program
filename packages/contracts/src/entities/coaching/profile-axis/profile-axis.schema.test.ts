import { describe, expect, it } from "vitest";

import { PROFILE_AXIS_CONSTANTS } from "./profile-axis.constants";
import {
  createProfileAxisSchema,
  PROFILE_AXIS_VALUES_UNIQUE_MESSAGE,
  profileAxisSchema,
  updateProfileAxisSchema,
} from "./profile-axis.schema";

const baseInput = {
  key: "level",
  label: "Level",
  values: ["RX"],
};

const baseEntity = {
  id: "clp9z8x7w0000abcd1234efgh",
  key: "level",
  label: "Level",
  values: ["RX", "SC"],
  binding: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ZERO_WIDTH_SPACE = "​";
const FULLWIDTH_RX = "ＲＸ";

describe("createProfileAxisSchema", () => {
  it("accepts minimal valid input", () => {
    const result = createProfileAxisSchema.safeParse(baseInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.key).toBe("level");
      expect(result.data.label).toBe("Level");
      expect(result.data.values).toEqual(["RX"]);
    }
  });

  it("accepts multiple unique values", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["RX", "SC", "M-F"],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.values).toEqual(["RX", "SC", "M-F"]);
    }
  });

  it("rejects empty values", () => {
    const result = createProfileAxisSchema.safeParse({ ...baseInput, values: [] });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate values with the uniqueness message on a values path", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["RX", "RX"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues[0];

      expect(issue?.message).toBe(PROFILE_AXIS_VALUES_UNIQUE_MESSAGE);
      expect(issue?.path).toContain("values");
    }
  });

  it("rejects a whitespace-only value", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["RX", "   "],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an all-zero-width value", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["RX", ZERO_WIDTH_SPACE],
    });

    expect(result.success).toBe(false);
  });

  it("strips zero-width chars inside a value", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: [`R${ZERO_WIDTH_SPACE}X`],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.values).toEqual(["RX"]);
    }
  });

  it("rejects values longer than MAX_VALUES", () => {
    const values = Array.from(
      { length: PROFILE_AXIS_CONSTANTS.MAX_VALUES + 1 },
      (_value, index) => `v${index}`,
    );

    const result = createProfileAxisSchema.safeParse({ ...baseInput, values });

    expect(result.success).toBe(false);
  });

  it("rejects an empty key", () => {
    const result = createProfileAxisSchema.safeParse({ ...baseInput, key: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only key", () => {
    const result = createProfileAxisSchema.safeParse({ ...baseInput, key: "   " });

    expect(result.success).toBe(false);
  });

  it("accepts a key at MAX_KEY_LENGTH", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      key: "x".repeat(PROFILE_AXIS_CONSTANTS.MAX_KEY_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a key longer than MAX_KEY_LENGTH", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      key: "x".repeat(PROFILE_AXIS_CONSTANTS.MAX_KEY_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("strips zero-width chars from key", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      key: `lev${ZERO_WIDTH_SPACE}el`,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.key).toBe("level");
    }
  });

  it("rejects an empty label", () => {
    const result = createProfileAxisSchema.safeParse({ ...baseInput, label: "" });

    expect(result.success).toBe(false);
  });

  it("accepts a label at MAX_LABEL_LENGTH", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      label: "x".repeat(PROFILE_AXIS_CONSTANTS.MAX_LABEL_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a label longer than MAX_LABEL_LENGTH", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      label: "x".repeat(PROFILE_AXIS_CONSTANTS.MAX_LABEL_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a value longer than MAX_VALUE_LENGTH", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["x".repeat(PROFILE_AXIS_CONSTANTS.MAX_VALUE_LENGTH + 1)],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a zero-width-separated duplicate value post-normalize", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: [`R${ZERO_WIDTH_SPACE}X`, "RX"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues[0];

      expect(issue?.message).toBe(PROFILE_AXIS_VALUES_UNIQUE_MESSAGE);
      expect(issue?.path).toContain("values");
    }
  });

  it("rejects an NFKC fullwidth duplicate value post-normalize", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: [FULLWIDTH_RX, "RX"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues[0];

      expect(issue?.message).toBe(PROFILE_AXIS_VALUES_UNIQUE_MESSAGE);
      expect(issue?.path).toContain("values");
    }
  });

  it("rejects a whitespace-padding duplicate value after edge-trim", () => {
    const result = createProfileAxisSchema.safeParse({
      ...baseInput,
      values: ["RX", "RX "],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues[0];

      expect(issue?.message).toBe(PROFILE_AXIS_VALUES_UNIQUE_MESSAGE);
      expect(issue?.path).toContain("values");
    }
  });

  it("keeps case-differing values distinct (case-sensitive by design)", () => {
    const result = createProfileAxisSchema.safeParse({
      key: "level",
      label: "Level",
      values: ["RX", "rx"],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.values).toEqual(["RX", "rx"]);
    }
  });

  it("strips a binding key (binding is not API-settable on create)", () => {
    const result = createProfileAxisSchema.safeParse({ ...baseInput, binding: "GENDER" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("binding");
    }
  });
});

describe("updateProfileAxisSchema", () => {
  it("accepts an empty object", () => {
    const result = updateProfileAxisSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts a single-field key subset", () => {
    const result = updateProfileAxisSchema.safeParse({ key: "scale" });

    expect(result.success).toBe(true);
  });

  it("accepts a single-field values subset", () => {
    const result = updateProfileAxisSchema.safeParse({ values: ["A", "B"] });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate values in a patch", () => {
    const result = updateProfileAxisSchema.safeParse({ values: ["A", "A"] });

    expect(result.success).toBe(false);
  });

  it("rejects an empty values array in a patch", () => {
    const result = updateProfileAxisSchema.safeParse({ values: [] });

    expect(result.success).toBe(false);
  });

  it("rejects a present-but-empty key in a patch", () => {
    const result = updateProfileAxisSchema.safeParse({ key: "" });

    expect(result.success).toBe(false);
  });

  it("accepts a single-field label subset", () => {
    const result = updateProfileAxisSchema.safeParse({ label: "Renamed" });

    expect(result.success).toBe(true);
  });

  it("strips a binding key (binding is not API-settable on update)", () => {
    const result = updateProfileAxisSchema.safeParse({ label: "Renamed", binding: "GENDER" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("binding");
    }
  });
});

describe("profileAxisSchema", () => {
  it("accepts a full valid entity", () => {
    const result = profileAxisSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid id", () => {
    const result = profileAxisSchema.safeParse({ ...baseEntity, id: "not-a-cuid" });

    expect(result.success).toBe(false);
  });

  it("rejects empty values on the entity schema", () => {
    const result = profileAxisSchema.safeParse({ ...baseEntity, values: [] });

    expect(result.success).toBe(false);
  });

  it("accepts a GENDER binding", () => {
    const result = profileAxisSchema.safeParse({ ...baseEntity, binding: "GENDER" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.binding).toBe("GENDER");
    }
  });

  it("accepts a null binding", () => {
    const result = profileAxisSchema.safeParse({ ...baseEntity, binding: null });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.binding).toBeNull();
    }
  });

  it("rejects an unknown binding value", () => {
    const result = profileAxisSchema.safeParse({ ...baseEntity, binding: "X" });

    expect(result.success).toBe(false);
  });

  it("rejects a missing binding field", () => {
    const result = profileAxisSchema.safeParse({
      id: baseEntity.id,
      key: baseEntity.key,
      label: baseEntity.label,
      values: baseEntity.values,
      createdAt: baseEntity.createdAt,
      updatedAt: baseEntity.updatedAt,
    });

    expect(result.success).toBe(false);
  });
});
