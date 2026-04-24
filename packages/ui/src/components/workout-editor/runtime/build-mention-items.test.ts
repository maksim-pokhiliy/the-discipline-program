import { describe, expect, it } from "vitest";

import {
  ExerciseStatus,
  MeasurementUnit,
  type ExerciseListItem,
} from "@repo/contracts/library/exercise";

import { buildMentionItems } from "./build-mention-items";

type ExerciseOverrides = Partial<ExerciseListItem> & {
  canonicalName: string;
};

const makeExercise = (overrides: ExerciseOverrides): ExerciseListItem => {
  const { canonicalName, aliases, ...rest } = overrides;

  return {
    id: `ex-${canonicalName.toLowerCase().replace(/\s+/g, "-")}`,
    canonicalName,
    normalizedName: canonicalName.toLowerCase(),
    aliases: aliases ?? [],
    description: null,
    videoUrl: null,
    measurementUnits: [MeasurementUnit.REPS],
    hasLoad: false,
    status: ExerciseStatus.APPROVED,
    mergedIntoId: null,
    createdByUserId: "clxxxxxxxxxxxxxxxxxxxxxxx",
    reviewedByUserId: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    usageCount: 0,
    ...rest,
  };
};

describe("buildMentionItems", () => {
  it("returns the top 10 existing items when query is empty", () => {
    const exercises = Array.from({ length: 15 }, (_, i) =>
      makeExercise({ canonicalName: `Exercise ${i + 1}` }),
    );

    const result = buildMentionItems("", exercises);

    expect(result).toHaveLength(10);

    result.forEach((item, index) => {
      expect(item.kind).toBe("existing");

      if (item.kind === "existing") {
        expect(item.exercise.canonicalName).toBe(`Exercise ${index + 1}`);
      }
    });
  });

  it("filters by canonicalName case-insensitively", () => {
    const frontSquat = makeExercise({ canonicalName: "Front Squat" });
    const backSquat = makeExercise({ canonicalName: "Back Squat" });

    const result = buildMentionItems("front", [frontSquat, backSquat]);

    const existing = result.filter((item) => item.kind === "existing");

    expect(existing).toEqual([{ kind: "existing", exercise: frontSquat }]);
  });

  it("matches via aliases case-insensitively", () => {
    const frontSquat = makeExercise({
      canonicalName: "Front Squat",
      aliases: ["fs", "fsq"],
    });

    const result = buildMentionItems("fs", [frontSquat]);

    const existing = result.filter((item) => item.kind === "existing");

    expect(existing).toEqual([{ kind: "existing", exercise: frontSquat }]);
  });

  it("returns only a create entry when nothing matches at or above the create threshold", () => {
    const unrelated = makeExercise({ canonicalName: "Deadlift" });

    const result = buildMentionItems("nonexistent", [unrelated]);

    expect(result).toEqual([{ kind: "create", query: "nonexistent" }]);
  });

  it("suppresses the create entry when the query exactly matches an existing canonicalName", () => {
    const frontSquat = makeExercise({ canonicalName: "Front Squat" });

    const result = buildMentionItems("front squat", [frontSquat]);

    expect(result).toEqual([{ kind: "existing", exercise: frontSquat }]);
  });
});
