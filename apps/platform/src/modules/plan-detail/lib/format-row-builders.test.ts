import { describe, expect, it } from "vitest";

import { buildRow } from "./format-row-builders";
import {
  ID_DEADLIFT,
  ID_MISS,
  ID_PLACEHOLDER,
  ID_REST,
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

  it("categorizes sets, reps, load, side and tempo into the summary when present", () => {
    const row = makeExerciseRow({
      sets: 4,
      reps: { kind: "count", value: 5 },
      load: { kind: "bodyweight" },
      side: { kind: "each_leg" },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
    });
    const result = buildRow(row, exerciseById, 0);

    expect(result.summary).toEqual({
      volume: "4 × 5",
      load: "BW",
      side: "each leg",
      tempo: "3-1-1-0",
      modifiers: [],
      notes: [],
    });
  });

  it("combines sets-only into the volume with the multiplier suffix", () => {
    const result = buildRow(makeExerciseRow({ sets: 4 }), exerciseById, 0);

    expect(result.summary.volume).toBe("4 ×");
  });

  it("renders reps-only as the bare rep notation in volume", () => {
    const result = buildRow(
      makeExerciseRow({ reps: { kind: "count", value: 5 } }),
      exerciseById,
      0,
    );

    expect(result.summary.volume).toBe("5");
  });

  it("leaves volume null when both sets and reps are absent", () => {
    const result = buildRow(makeExerciseRow(), exerciseById, 0);

    expect(result.summary.volume).toBeNull();
  });

  it("strips the brackets from side and tempo", () => {
    const row = makeExerciseRow({
      side: { kind: "each_leg" },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
    });
    const result = buildRow(row, exerciseById, 0);

    expect(result.summary.side).toBe("each leg");
    expect(result.summary.tempo).toBe("3-1-1-0");
  });

  it("collects each modifier name into the summary modifiers list", () => {
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

    expect(result.summary.modifiers).toEqual(["from sofa", "neutral grip"]);
  });

  it("leaves the summary notes empty (notes are appended by formatRow)", () => {
    const result = buildRow(makeExerciseRow(), exerciseById, 0);

    expect(result.summary.notes).toEqual([]);
  });

  it("marks a placeholder-natured exercise as dashed with no demo url", () => {
    const result = buildRow(makeExerciseRow({ exerciseId: ID_PLACEHOLDER }), exerciseById, 0);

    expect(result.dashed).toBe(true);
    expect(result.demoUrl).toBeNull();
    expect(result.kindBadge).toBe("EX");
    expect(result.kindCls).toBe("ex");
    expect(result.mainText).toBe("Coach choice");
  });

  it("renders a rest-natured exercise distinctly with the REST badge and not dashed", () => {
    const result = buildRow(makeExerciseRow({ exerciseId: ID_REST }), exerciseById, 0);

    expect(result.kindBadge).toBe("REST");
    expect(result.kindCls).toBe("rest");
    expect(result.dashed).toBe(false);
    expect(result.mainText).toBe("Rest");
  });
});
