import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatRow } from "./format-row";
import {
  DEMO_URL,
  ID_DEADLIFT,
  ID_MISS,
  baseRowFields,
  exerciseById,
  makeExerciseRow,
  makeFootnoteRow,
  makeInnerLadderMarkerRow,
  makePlaceholderRow,
  makeRepDefinitionRow,
  makeRestRow,
  makeRestSlotRow,
  makeStandaloneLoadRow,
  makeStandaloneUrlRow,
} from "./format-row.fixtures";

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

  describe("FOOTNOTE row kind", () => {
    it("renders marker + elements + target", () => {
      const result = formatRow(makeFootnoteRow(), exerciseById, 0);

      expect(result.mainText).toBe("* Back Squat × 5 reps (each round)");
      expect(result.kindBadge).toBe("FN");
      expect(result.kindCls).toBe("foot");
      expect(result.ord).toBe("*");
    });

    it("does NOT append notes to subParts for FOOTNOTE kind", () => {
      const result = formatRow(makeFootnoteRow({ notes: "important" }), exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });
  });

  describe("STANDALONE_LOAD row kind", () => {
    it("renders formatted load mainText with 'applies to all rows above' sub", () => {
      const result = formatRow(makeStandaloneLoadRow(), exerciseById, 0);

      expect(result.mainText).toBe("20 kg");
      expect(result.subParts).toEqual(["applies to all rows above"]);
      expect(result.kindBadge).toBe("LD");
      expect(result.kindCls).toBe("load");
      expect(result.ord).toBe("L");
    });
  });

  describe("STANDALONE_URL row kind", () => {
    it("renders the url and 'schema reference' sub for whole_schema scope", () => {
      const result = formatRow(makeStandaloneUrlRow(), exerciseById, 0);

      expect(result.mainText).toBe("https://example.com/ref.pdf");
      expect(result.subParts).toEqual(["schema reference"]);
      expect(result.kindBadge).toBe("URL");
      expect(result.kindCls).toBe("url");
      expect(result.ord).toBe("U");
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

  describe("INNER_LADDER_MARKER row kind", () => {
    it("renders steps joined by '-' suffix ' :', dashed=true, ord='—'", () => {
      const result = formatRow(makeInnerLadderMarkerRow(), exerciseById, 0);

      expect(result.mainText).toBe("12-9-6 :");
      expect(result.subParts).toEqual(["ladder marker — segments rows below"]);
      expect(result.kindBadge).toBe("↓");
      expect(result.kindCls).toBe("ladder");
      expect(result.dashed).toBe(true);
      expect(result.ord).toBe("—");
    });
  });

  describe("REP_DEFINITION row kind", () => {
    it("renders '<total> reps = <count>× <name> + ...' with ord='≡'", () => {
      const result = formatRow(makeRepDefinitionRow(), exerciseById, 0);

      expect(result.mainText).toBe("5 reps = 1× Back Squat + 2× Deadlift");
      expect(result.subParts).toEqual(["rep definition"]);
      expect(result.kindBadge).toBe("≡");
      expect(result.kindCls).toBe("ex");
      expect(result.ord).toBe("≡");
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
    it("appends quoted notes to subParts for non-FOOTNOTE rows", () => {
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

    it("falls back to '?' for missing exercise in REP_DEFINITION composition", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REP_DEFINITION",
        rowPayload: {
          rowKind: "REP_DEFINITION",
          equality: {
            form: "inline_equality",
            totalReps: 3,
            composition: [{ exerciseId: ID_MISS, count: 1 }],
          },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("3 reps = 1× ?");
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
});
