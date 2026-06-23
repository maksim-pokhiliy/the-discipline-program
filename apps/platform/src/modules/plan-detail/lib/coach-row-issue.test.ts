import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";

import { createSchemaRowSchema } from "@repo/contracts/lms/schema-row";

import { coachRowIssue } from "./coach-row-issue";

const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const AXIS_ID_LEVEL = "clp9z8x7w0000abcd12axlevel";
const AXIS_ID_SEX = "clp9z8x7w0000abcd12ax00sex";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";

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

  it("maps an unbound byProfile catalog axis to the pick prompt", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [{ axisId: "", label: "", values: [], binding: null }],
        cells: [{ coords: ["RX"], kg: 5 }],
      },
    });

    expect(coachRowIssue(issue)).toBe("Pick an axis for this dimension (or create one).");
  });

  it("maps two byProfile axes on the same dimension to the distinct prompt", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [
          { axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX"], binding: null },
          { axisId: AXIS_ID_LEVEL, label: "Level", values: ["SC"], binding: null },
        ],
        cells: [{ coords: ["RX", "SC"], kg: 5 }],
      },
    });

    expect(coachRowIssue(issue)).toBe("Each axis must be a different dimension.");
  });

  it("maps a byProfile axis with duplicate values (QA-001)", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [{ axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "RX"], binding: null }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["RX"], kg: 30 },
        ],
      },
    });

    expect(coachRowIssue(issue)).toBe("Give each axis value a unique name; two are the same.");
  });

  it("maps a non-positive byProfile cell weight", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [{ axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX"], binding: null }],
        cells: [{ coords: ["RX"], kg: 0 }],
      },
    });

    expect(coachRowIssue(issue)).toBe("Enter a weight greater than 0 for each combination.");
  });

  it("maps a byProfile cartesian-cover gap", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [
          { axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"], binding: null },
          { axisId: AXIS_ID_SEX, label: "Sex", values: ["♂", "♀"], binding: null },
        ],
        cells: [
          { coords: ["RX", "♂"], kg: 9 },
          { coords: ["RX", "♀"], kg: 6 },
          { coords: ["SC", "♂"], kg: 6 },
        ],
      },
    });

    expect(coachRowIssue(issue)).toBe("Fill in a weight for every combination of axis values.");
  });

  it("maps a byProfile coord that is not in its axis", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [{ axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"], binding: null }],
        cells: [
          { coords: ["RX"], kg: 9 },
          { coords: ["MASTER"], kg: 6 },
        ],
      },
    });

    expect(coachRowIssue(issue)).toBe("Pick axis values that match the axes you defined.");
  });

  it("maps a bound gender byProfile axis with a coord gap to the coords prompt", () => {
    const issue = firstIssue({
      load: {
        kind: "byProfile",
        axes: [
          {
            axisId: SYSTEM_GENDER_AXIS_ID,
            label: "Gender",
            values: ["Male", "Female"],
            binding: "GENDER",
          },
        ],
        cells: [
          { coords: ["Male"], kg: 24 },
          { coords: ["Other"], kg: 20 },
        ],
      },
    });

    expect(coachRowIssue(issue)).toBe("Pick axis values that match the axes you defined.");
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

  it("maps an over-long free tempo note (QA-A-01)", () => {
    const issue = firstIssue({ tempo: "x".repeat(81) });

    expect(coachRowIssue(issue)).toBe(
      "Shorten the tempo to a 4-digit code like 3-1-X-0 or a brief note.",
    );
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
