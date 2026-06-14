import { describe, expect, it } from "vitest";

import type { TempoModifier } from "@repo/contracts/lms/_shared";

import { formatTempo } from "./format-tempo";

describe("formatTempo", () => {
  it("renders '<e>-<pb>-<c>-<pt>' for numeric positions", () => {
    const t: TempoModifier = { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 };

    expect(formatTempo(t)).toBe("3-1-2-0");
  });

  it("renders an 'X' position verbatim", () => {
    const t: TempoModifier = { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 };

    expect(formatTempo(t)).toBe("3-1-X-0");
  });

  it("returns a free-string tempo verbatim", () => {
    const t: TempoModifier = "slow tempo";

    expect(formatTempo(t)).toBe("slow tempo");
  });
});
