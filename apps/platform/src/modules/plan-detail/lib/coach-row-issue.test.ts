import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";

import { createSchemaRowSchema } from "@repo/contracts/lms/schema-row";

import { coachRowIssue } from "./coach-row-issue";

const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";

const firstIssue = (payload: Record<string, unknown>): ZodIssue => {
  const result = createSchemaRowSchema.safeParse({
    schemaId: SCHEMA_ID,
    exerciseId: EXERCISE_ID,
    ...payload,
  });

  if (result.success) {
    throw new Error("expected the payload to fail validation");
  }

  const [issue] = result.error.issues;

  if (issue === undefined) {
    throw new Error("expected at least one issue");
  }

  return issue;
};

describe("coachRowIssue maps contract issues to coach prose (QA-001 regression pin)", () => {
  it("maps a non-positive sets count", () => {
    expect(coachRowIssue(firstIssue({ sets: 0 }))).toBe("Enter a number of sets greater than 0.");
  });

  it("maps an absolute load weight of 0", () => {
    const issue = firstIssue({ load: { kind: "absolute", count: 1, kg: 0 } });

    expect(coachRowIssue(issue)).toBe("Enter a weight greater than 0.");
  });

  it("maps an empty byProfile label", () => {
    const issue = firstIssue({ load: { kind: "byProfile", entries: [{ label: "", kg: 5 }] } });

    expect(coachRowIssue(issue)).toBe("Add a label for each profile weight.");
  });

  it("maps a non-positive byProfile weight", () => {
    const issue = firstIssue({ load: { kind: "byProfile", entries: [{ label: "m", kg: 0 }] } });

    expect(coachRowIssue(issue)).toBe("Enter a weight greater than 0 for each profile weight.");
  });

  it("maps an out-of-range percentage value", () => {
    const issue = firstIssue({
      load: { kind: "percentage", value: 300, reference: { scope: "self" } },
    });

    expect(coachRowIssue(issue)).toBe("Enter a % between 0 and 200.");
  });

  it("maps a percentage rangeMax that is not above the value", () => {
    const issue = firstIssue({
      load: { kind: "percentage", value: 80, rangeMax: 70, reference: { scope: "self" } },
    });

    expect(coachRowIssue(issue)).toBe("Max % must be higher than the %.");
  });

  it("maps a missing other-exercise reference target", () => {
    const issue = firstIssue({
      load: {
        kind: "percentage",
        value: 80,
        reference: { scope: "other_exercise", targetExerciseId: "" },
      },
    });

    expect(coachRowIssue(issue)).toBe("Pick the reference exercise.");
  });

  it("maps a reps range whose min is not below the max", () => {
    const issue = firstIssue({ reps: { kind: "range", min: 5, max: 3 } });

    expect(coachRowIssue(issue)).toBe("The min reps must be lower than the max.");
  });

  it("maps a unit-bound reps value that is neither value nor range", () => {
    const issue = firstIssue({ reps: { kind: "unit_bound", unit: "sec" } });

    expect(coachRowIssue(issue)).toBe("Enter a time or distance value.");
  });

  it("maps a per-limb side count of 0", () => {
    const issue = firstIssue({ side: { kind: "each_leg", countPerLimb: 0 } });

    expect(coachRowIssue(issue)).toBe("Enter a per-limb count greater than 0.");
  });

  it("maps a percentage value (the rangeMax field) when its max % is out of range", () => {
    const issue = firstIssue({
      load: { kind: "percentage", value: 80, rangeMax: 300, reference: { scope: "self" } },
    });

    expect(coachRowIssue(issue)).toBe("Enter a max % between 0 and 200.");
  });

  it("maps a duplicate modifier id", () => {
    const issue = firstIssue({ modifierIds: [EXERCISE_ID, EXERCISE_ID] });

    expect(coachRowIssue(issue)).toBe("Remove the duplicate modifier.");
  });

  it("maps too many modifier ids", () => {
    const issue = firstIssue({
      modifierIds: Array.from(
        { length: 21 },
        (_, index) => `clp9z8x7w0000abcd12mod${String(index).padStart(4, "0")}`,
      ),
    });

    expect(coachRowIssue(issue)).toBe("Pick fewer modifiers.");
  });
});

describe("coachRowIssue fallthrough", () => {
  it("falls back to the path-prefixed zod message for an unmapped issue", () => {
    const unmapped: ZodIssue = {
      code: "custom",
      path: ["schemaId"],
      message: "Invalid cuid",
    };

    expect(coachRowIssue(unmapped)).toBe("schemaId: Invalid cuid");
  });
});
