import { describe, expect, it } from "vitest";

import type { TempoModifier } from "@repo/contracts/lms/_shared";

import { formatTempo } from "./format-tempo";

describe("formatTempo", () => {
  describe("fullTempo branch", () => {
    it("renders 'Tempo <e>-<pb>-<c>-<pt>' for non-explosive concentric", () => {
      const t: TempoModifier = {
        fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 },
      };

      expect(formatTempo(t)).toBe("Tempo 3-1-2-0");
    });

    it("renders concentric=0 as 'X' (explosive)", () => {
      const t: TempoModifier = {
        fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 },
      };

      expect(formatTempo(t)).toBe("Tempo 3-1-X-0");
    });
  });

  describe("partial-tempo branch", () => {
    it("renders 'slow ecc. <sec>s' for slowEccentric only", () => {
      const t: TempoModifier = { slowEccentric: { durationSec: 4 } };

      expect(formatTempo(t)).toBe("slow ecc. 4s");
    });

    it("renders 'pause up <sec>s' for pauseInUp only", () => {
      const t: TempoModifier = { pauseInUp: { durationSec: 2 } };

      expect(formatTempo(t)).toBe("pause up 2s");
    });

    it("renders 'hold last <sec>s' for holdAfterLast only", () => {
      const t: TempoModifier = { holdAfterLast: { durationSec: 10 } };

      expect(formatTempo(t)).toBe("hold last 10s");
    });

    it("renders 'pause every <N> for <sec>s' for perNthRepPause only", () => {
      const t: TempoModifier = {
        perNthRepPause: { everyN: 3, pauseSec: 5 },
      };

      expect(formatTempo(t)).toBe("pause every 3 for 5s");
    });

    it("joins multiple partials with ' · ' in declared order", () => {
      const t: TempoModifier = {
        slowEccentric: { durationSec: 4 },
        pauseInUp: { durationSec: 2 },
      };

      expect(formatTempo(t)).toBe("slow ecc. 4s · pause up 2s");
    });

    it("joins all four partials with ' · ' separator", () => {
      const t: TempoModifier = {
        slowEccentric: { durationSec: 3 },
        pauseInUp: { durationSec: 1 },
        holdAfterLast: { durationSec: 5 },
        perNthRepPause: { everyN: 2, pauseSec: 4 },
      };

      expect(formatTempo(t)).toBe(
        "slow ecc. 3s · pause up 1s · hold last 5s · pause every 2 for 4s",
      );
    });
  });
});
