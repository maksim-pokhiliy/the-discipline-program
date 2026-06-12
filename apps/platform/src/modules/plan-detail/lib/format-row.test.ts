import { describe, expect, it } from "vitest";

import { type ExerciseById, formatRow } from "./format-row";
import {
  DEMO_URL,
  ID_DEADLIFT,
  ID_MISS,
  exerciseById,
  makeExercise,
  makeExerciseRow,
  makePlaceholderRow,
  makeRestRow,
  makeRestSlotRow,
} from "./format-row.fixtures";

const ID_PLACEHOLDER_ATOMIC = "ckplaceh1234567890abcdef01";
const PLACEHOLDER_CANONICAL_NAME = "Any squat";
const PLACEHOLDER_DEMO_URL = "https://example.com/should-not-render.mp4";

const exerciseByIdWithPlaceholder: ExerciseById = new Map([
  ...exerciseById,
  [
    ID_PLACEHOLDER_ATOMIC,
    makeExercise({
      id: ID_PLACEHOLDER_ATOMIC,
      canonicalName: PLACEHOLDER_CANONICAL_NAME,
      canonicalCompoundType: "PLACEHOLDER",
      placeholderFlag: true,
      defaultDemoUrls: [PLACEHOLDER_DEMO_URL],
    }),
  ],
]);

describe("formatRow", () => {
  describe("EXERCISE row kind", () => {
    it("renders the canonical name for atomic exercise as mainText", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.mainText).toBe("Back Squat");
      expect(result.kindBadge).toBe("EX");
      expect(result.kindCls).toBe("ex");
      expect(result.dashed).toBe(false);
      expect(result.ord).toBe("1");
    });

    it("returns null formPillText for atomic form", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.formPillText).toBeNull();
    });

    it("returns the first demo url for atomic form when present", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.demoUrl).toBe(DEMO_URL);
    });

    it("returns null demoUrl when defaultDemoUrls is empty", () => {
      const row = makeExerciseRow({
        rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_DEADLIFT } },
      });
      const result = formatRow(row, exerciseById, 0);

      expect(result.demoUrl).toBeNull();
    });

    it("renders placeholder-ref chrome for atomic-form row pointing at placeholderFlag exercise", () => {
      const row = makeExerciseRow({
        rowPayload: {
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
        },
      });
      const result = formatRow(row, exerciseByIdWithPlaceholder, 0);

      expect(result.formPillText).toBe("placeholder ref");
      expect(result.dashed).toBe(true);
      expect(result.demoUrl).toBeNull();
      expect(result.subParts).toContain("placeholder");
      expect(result.mainText).toBe(PLACEHOLDER_CANONICAL_NAME);
    });
  });

  describe("REST row kind", () => {
    it("renders formatted rest spec as mainText", () => {
      const result = formatRow(makeRestRow(), exerciseById, 2);

      expect(result.mainText).toBe("rest 90s between sets");
      expect(result.kindBadge).toBe("RST");
      expect(result.kindCls).toBe("rest");
      expect(result.ord).toBe("3");
      expect(result.subParts).toEqual([]);
    });
  });

  describe("PLACEHOLDER row kind", () => {
    it("renders placeholder text + 'placeholder · <kind>' sub with dashed=true and ord='?'", () => {
      const result = formatRow(makePlaceholderRow(), exerciseById, 0);

      expect(result.mainText).toBe("ABS finisher");
      expect(result.subParts).toEqual(["placeholder · coach choice slot"]);
      expect(result.kindBadge).toBe("?");
      expect(result.kindCls).toBe("placeholder");
      expect(result.dashed).toBe(true);
      expect(result.ord).toBe("?");
    });
  });

  describe("REST_SLOT row kind", () => {
    it("renders the static 'Rest slot' main and 'EMOM minute · rest' sub with ord='R'", () => {
      const result = formatRow(makeRestSlotRow(), exerciseById, 0);

      expect(result.mainText).toBe("Rest slot");
      expect(result.subParts).toEqual(["EMOM minute · rest"]);
      expect(result.kindBadge).toBe("RS");
      expect(result.kindCls).toBe("rest");
      expect(result.ord).toBe("R");
    });
  });

  describe("notes append", () => {
    it("appends quoted notes to subParts when notes is present", () => {
      const result = formatRow(makeExerciseRow({ notes: "explosive" }), exerciseById, 0);

      expect(result.subParts).toContain("'explosive'");
    });

    it("does NOT append notes when notes is null", () => {
      const result = formatRow(makeExerciseRow({ notes: null }), exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });

    it("does NOT append notes when notes is empty string", () => {
      const result = formatRow(makeExerciseRow({ notes: "" }), exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });
  });

  describe("exerciseById miss fallback", () => {
    it("falls back to '—' for missing atomic exercise in EXERCISE row", () => {
      const row = makeExerciseRow({
        rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_MISS } },
      });
      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("—");
    });
  });

  describe("per-RowKind ord values", () => {
    it("uses 1-based index for EXERCISE", () => {
      expect(formatRow(makeExerciseRow(), exerciseById, 0).ord).toBe("1");
      expect(formatRow(makeExerciseRow(), exerciseById, 4).ord).toBe("5");
    });

    it("uses 1-based index for REST", () => {
      expect(formatRow(makeRestRow(), exerciseById, 1).ord).toBe("2");
    });
  });

  describe("row media as the demo link", () => {
    const ROW_MEDIA_URL = "https://example.com/demo/row-level.mp4";

    it("surfaces row media for a PLACEHOLDER row", () => {
      const row = { ...makePlaceholderRow(), media: { url: ROW_MEDIA_URL } };

      expect(formatRow(row, exerciseById, 0).demoUrl).toBe(ROW_MEDIA_URL);
    });

    it("prefers row media over the catalog demo for an EXERCISE row", () => {
      const row = { ...makeExerciseRow(), media: { url: ROW_MEDIA_URL } };

      expect(formatRow(row, exerciseById, 0).demoUrl).toBe(ROW_MEDIA_URL);
    });

    it("falls back to the catalog demo when media is null", () => {
      expect(formatRow(makeExerciseRow(), exerciseById, 0).demoUrl).toBe(DEMO_URL);
    });
  });
});
