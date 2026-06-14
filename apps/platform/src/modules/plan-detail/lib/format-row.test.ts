import { describe, expect, it } from "vitest";

import { formatRow } from "./format-row";
import {
  DEMO_URL,
  ID_DEADLIFT,
  ID_MISS,
  exerciseById,
  makeExerciseRow,
  makePlaceholderRow,
} from "./format-row.fixtures";

describe("formatRow", () => {
  describe("exercise row", () => {
    it("renders the canonical name as mainText with the EX badge", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.mainText).toBe("Back Squat");
      expect(result.kindBadge).toBe("EX");
      expect(result.kindCls).toBe("ex");
      expect(result.dashed).toBe(false);
      expect(result.ord).toBe("1");
    });

    it("returns null formPillText", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.formPillText).toBeNull();
    });

    it("returns the first demo url when present", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.demoUrl).toBe(DEMO_URL);
    });

    it("returns null demoUrl when defaultDemoUrls is empty", () => {
      const result = formatRow(makeExerciseRow({ exerciseId: ID_DEADLIFT }), exerciseById, 0);

      expect(result.demoUrl).toBeNull();
    });

    it("falls back to 'exercise' for a missing exercise id", () => {
      const result = formatRow(makeExerciseRow({ exerciseId: ID_MISS }), exerciseById, 0);

      expect(result.mainText).toBe("exercise");
    });
  });

  describe("placeholder exercise row", () => {
    it("renders the placeholder name with dashed=true and null demoUrl", () => {
      const result = formatRow(makePlaceholderRow(), exerciseById, 0);

      expect(result.mainText).toBe("Coach choice");
      expect(result.dashed).toBe(true);
      expect(result.demoUrl).toBeNull();
    });
  });

  describe("summary categories", () => {
    it("categorizes sets, reps, load, side, tempo and modifiers", () => {
      const row = makeExerciseRow({
        sets: 3,
        reps: { kind: "count", value: 5 },
        load: { kind: "bodyweight" },
        side: { kind: "each_leg" },
        tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
        modifiers: [
          {
            id: "ckmod01234567890abcdef0123",
            name: "from sofa",
            nameLower: "from sofa",
            notes: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          },
        ],
      });
      const result = formatRow(row, exerciseById, 0);

      expect(result.summary).toEqual({
        volume: "3 × 5",
        load: "BW",
        side: "each leg",
        tempo: "3-1-1-0",
        modifiers: ["from sofa"],
        notes: [],
      });
    });
  });

  describe("notes append", () => {
    it("puts each note (unquoted) into the summary notes when notes is present", () => {
      const result = formatRow(makeExerciseRow({ notes: ["explosive"] }), exerciseById, 0);

      expect(result.summary.notes).toContain("explosive");
    });

    it("leaves summary notes empty when notes is null", () => {
      const result = formatRow(makeExerciseRow({ notes: null }), exerciseById, 0);

      expect(result.summary.notes).toEqual([]);
    });

    it("leaves summary notes empty when notes is an empty list", () => {
      const result = formatRow(makeExerciseRow({ notes: [] }), exerciseById, 0);

      expect(result.summary.notes).toEqual([]);
    });
  });

  describe("ord values", () => {
    it("uses the 1-based index", () => {
      expect(formatRow(makeExerciseRow(), exerciseById, 0).ord).toBe("1");
      expect(formatRow(makeExerciseRow(), exerciseById, 4).ord).toBe("5");
    });
  });

  describe("row media as the demo link", () => {
    const ROW_MEDIA_URL = "https://example.com/demo/row-level.mp4";

    it("prefers row media over the catalog demo", () => {
      const row = makeExerciseRow({ media: { url: ROW_MEDIA_URL } });

      expect(formatRow(row, exerciseById, 0).demoUrl).toBe(ROW_MEDIA_URL);
    });

    it("falls back to the catalog demo when media is null", () => {
      expect(formatRow(makeExerciseRow(), exerciseById, 0).demoUrl).toBe(DEMO_URL);
    });
  });
});
