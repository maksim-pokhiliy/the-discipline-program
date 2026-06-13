import { describe, expect, it } from "vitest";

import { NOTE_MAX_LENGTH, NOTES_MAX_COUNT, notesListSchema } from "./notes";

describe("notesListSchema", () => {
  it("accepts an empty list", () => {
    expect(notesListSchema.safeParse([]).success).toBe(true);
  });

  it("accepts a list of non-empty notes", () => {
    expect(notesListSchema.safeParse(["first cue", "second cue"]).success).toBe(true);
  });

  it("trims surrounding whitespace on each note", () => {
    const result = notesListSchema.safeParse(["  trimmed  "]);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data[0]).toBe("trimmed");
    }
  });

  it("rejects an empty-string note (min 1 after trim)", () => {
    expect(notesListSchema.safeParse([""]).success).toBe(false);
  });

  it("rejects a whitespace-only note (min 1 after trim)", () => {
    expect(notesListSchema.safeParse(["   "]).success).toBe(false);
  });

  it("rejects a note over NOTE_MAX_LENGTH", () => {
    expect(notesListSchema.safeParse(["x".repeat(NOTE_MAX_LENGTH + 1)]).success).toBe(false);
  });

  it("rejects a list over NOTES_MAX_COUNT", () => {
    const tooMany = Array.from({ length: NOTES_MAX_COUNT + 1 }, (_, i) => `note ${i}`);

    expect(notesListSchema.safeParse(tooMany).success).toBe(false);
  });

  it("rejects a non-array root", () => {
    expect(notesListSchema.safeParse("just a string").success).toBe(false);
  });
});
