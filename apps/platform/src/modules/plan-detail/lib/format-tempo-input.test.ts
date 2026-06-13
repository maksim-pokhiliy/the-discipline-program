import { describe, expect, it } from "vitest";

import type { TempoModifier } from "@repo/contracts/lms/_shared";

import { formatTempoInput } from "./format-tempo-input";
import { parseTempo } from "./parse-tempo";

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
});

describe("formatTempoInput round-trips with parseTempo", () => {
  it("re-parses a serialized numeric tempo to the same value", () => {
    const tempo: TempoModifier = { eccentric: 4, pauseBottom: 0, concentric: 1, pauseTop: 2 };

    expect(parseTempo(formatTempoInput(tempo))).toStrictEqual({ ok: true, value: tempo });
  });

  it("re-parses a serialized X-hold tempo to the same value", () => {
    const tempo: TempoModifier = { eccentric: "X", pauseBottom: 2, concentric: "X", pauseTop: 0 };

    expect(parseTempo(formatTempoInput(tempo))).toStrictEqual({ ok: true, value: tempo });
  });

  it("re-parses a serialized cleared tempo to null", () => {
    expect(parseTempo(formatTempoInput(null))).toStrictEqual({ ok: true, value: null });
  });
});
