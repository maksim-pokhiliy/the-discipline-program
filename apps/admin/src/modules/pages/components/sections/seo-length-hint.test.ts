import { describe, expect, it } from "vitest";

import {
  formatLengthHint,
  SEO_DESCRIPTION_LENGTH_HINT,
  SEO_TITLE_LENGTH_HINT,
} from "./seo-length-hint";

describe("formatLengthHint", () => {
  it("counts an absent value as zero", () => {
    expect(formatLengthHint(undefined, SEO_TITLE_LENGTH_HINT)).toBe("0 / 60");
  });

  it("shows the typed length against the recommended length", () => {
    expect(formatLengthHint("Fixture", SEO_DESCRIPTION_LENGTH_HINT)).toBe("7 / 160");
  });

  it("keeps counting past the recommended length", () => {
    const length = SEO_TITLE_LENGTH_HINT + 1;

    expect(formatLengthHint("x".repeat(length), SEO_TITLE_LENGTH_HINT)).toBe(`${length} / 60`);
  });
});
