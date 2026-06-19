import { describe, expect, it } from "vitest";

import type { TempoModifier } from "@repo/contracts/lms/_shared";

import { formatTempoInput } from "./format-tempo-input";

describe("formatTempoInput", () => {
  it("renders a cleared tempo as an empty string", () => {
    expect(formatTempoInput(null)).toBe("");
  });

  it("joins the four positions with dashes", () => {
    const tempo: TempoModifier = { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 };

    expect(formatTempoInput(tempo)).toBe("3-1-2-0");
  });

  it("preserves the X hold position", () => {
    const tempo: TempoModifier = { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 };

    expect(formatTempoInput(tempo)).toBe("3-1-X-0");
  });

  it("returns a free-string tempo verbatim", () => {
    expect(formatTempoInput("slow tempo")).toBe("slow tempo");
  });
});
