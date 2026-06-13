import { describe, expect, it } from "vitest";

import { buildRow } from "./format-row-builders";
import {
  ID_DEADLIFT,
  ID_MISS,
  ID_PLACEHOLDER,
  exerciseById,
  makeExerciseRow,
} from "./format-row.fixtures";

describe("buildRow", () => {
  it("returns null demoUrl when the exercise lookup misses", () => {
    const result = buildRow(makeExerciseRow({ exerciseId: ID_MISS }), exerciseById, 0);

    expect(result.mainText).toBe("exercise");
    expect(result.demoUrl).toBeNull();
  });

  it("returns null demoUrl when the exercise has no demo urls", () => {
    const result = buildRow(makeExerciseRow({ exerciseId: ID_DEADLIFT }), exerciseById, 0);

    expect(result.demoUrl).toBeNull();
  });

  it("pushes sets, reps, load, side and tempo sub-parts when present", () => {
    const row = makeExerciseRow({
      sets: 4,
      reps: { kind: "count", value: 5 },
      load: { kind: "bodyweight" },
      side: { kind: "each_leg" },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
    });
    const result = buildRow(row, exerciseById, 0);

    expect(result.subParts).toEqual(["×4", "5 reps", "BW", "each leg", "Tempo 3-1-1-0"]);
  });

  it("joins modifier names into a single sub-part", () => {
    const row = makeExerciseRow({
      modifiers: [
        {
          id: "ckmod01234567890abcdef0123",
          name: "from sofa",
          nameLower: "from sofa",
          notes: null,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
        {
          id: "ckmod11234567890abcdef0123",
          name: "neutral grip",
          nameLower: "neutral grip",
          notes: null,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      ],
    });
    const result = buildRow(row, exerciseById, 0);

    expect(result.subParts).toContain("from sofa, neutral grip");
  });

  it("marks a placeholderFlag exercise as dashed with no demo url", () => {
    const result = buildRow(makeExerciseRow({ exerciseId: ID_PLACEHOLDER }), exerciseById, 0);

    expect(result.dashed).toBe(true);
    expect(result.demoUrl).toBeNull();
    expect(result.mainText).toBe("Coach choice");
  });
});
