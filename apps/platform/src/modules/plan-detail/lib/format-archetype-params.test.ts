import { describe, expect, it } from "vitest";

import type { RestSpec } from "@repo/contracts/lms/_shared";
import type { ArchetypeParams } from "@repo/contracts/lms/schema";

import { formatArchetypeParams } from "./format-archetype-params";

const makeRest = (overrides: Partial<RestSpec> = {}): RestSpec => ({
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
  ...overrides,
});

describe("formatArchetypeParams", () => {
  describe("n-rounds", () => {
    it("renders countForm=exact as '<count> rounds'", () => {
      const p: ArchetypeParams = {
        archetype: "n-rounds",
        params: { countForm: "exact", count: 5 },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 rounds"]);
    });

    it("renders countForm=range as '<min>–<max> rounds'", () => {
      const p: ArchetypeParams = {
        archetype: "n-rounds",
        params: { countForm: "range", countRange: { min: 5, max: 7 } },
      };

      expect(formatArchetypeParams(p)).toEqual(["5–7 rounds"]);
    });

    it("renders countForm=count_times_reps as '<count> × <reps>' without a 'reps' tail", () => {
      const p: ArchetypeParams = {
        archetype: "n-rounds",
        params: { countForm: "count_times_reps", count: 5, repsPerSet: 10 },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 × 10"]);
    });

    it("emits the 'reps' tail when countForm is not count_times_reps and repsPerSet is set", () => {
      const p: ArchetypeParams = {
        archetype: "n-rounds",
        params: { countForm: "exact", count: 5, repsPerSet: 10 },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 rounds", "10 reps"]);
    });

    it("appends the formatRestSpec output when rest is set", () => {
      const p: ArchetypeParams = {
        archetype: "n-rounds",
        params: {
          countForm: "exact",
          count: 5,
          rest: makeRest({ duration: { value: 2, unit: "min" }, scope: "between_rounds" }),
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 rounds", "rest 2 min between rounds"]);
    });
  });

  describe("alternating-sets", () => {
    it("renders setEnumeration ordinals joined by ' | ' suffixed with ' sets'", () => {
      const p: ArchetypeParams = {
        archetype: "alternating-sets",
        params: { setEnumeration: [1, 3, 5] },
      };

      expect(formatArchetypeParams(p)).toEqual(["1st | 3rd | 5th sets"]);
    });

    it("handles teens 11/12/13 with the 'th' suffix", () => {
      const p: ArchetypeParams = {
        archetype: "alternating-sets",
        params: { setEnumeration: [11, 12, 13] },
      };

      expect(formatArchetypeParams(p)).toEqual(["11th | 12th | 13th sets"]);
    });
  });

  describe.each([
    ["ladder-descending"],
    ["ladder-ascending"],
    ["ladder-vertex-down-pyramid"],
    ["ladder-spike"],
  ] as const)("%s", (archetype) => {
    it("renders the steps array joined by '-'", () => {
      const p: ArchetypeParams = {
        archetype,
        params: { steps: [12, 9, 6, 3] },
      };

      expect(formatArchetypeParams(p)).toEqual(["12-9-6-3"]);
    });
  });

  describe("parallel-ladders-descending", () => {
    it("renders the count headline then one entry per ladder", () => {
      const p: ArchetypeParams = {
        archetype: "parallel-ladders-descending",
        params: {
          ladders: [{ steps: [12, 9, 6] }, { steps: [3, 6, 9], direction: "asc" }],
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["2 parallel ladders", "12-9-6", "3-6-9 (asc)"]);
    });
  });

  describe("parallel-ladders-mixed-direction", () => {
    it("renders direction suffix per ladder when set", () => {
      const p: ArchetypeParams = {
        archetype: "parallel-ladders-mixed-direction",
        params: {
          ladders: [
            { steps: [10, 8], direction: "desc" },
            { steps: [4, 6], direction: "asc" },
          ],
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["2 parallel ladders", "10-8 (desc)", "4-6 (asc)"]);
    });
  });

  describe("parallel-pyramids", () => {
    it("renders the pyramid count headline only", () => {
      const p: ArchetypeParams = {
        archetype: "parallel-pyramids",
        params: { pyramids: [{ steps: [1, 2, 3] }, { steps: [4, 5, 6] }] },
      };

      expect(formatArchetypeParams(p)).toEqual(["2 parallel pyramids"]);
    });
  });

  describe("amrap-flat", () => {
    it("renders 'AMRAP <durationMin> min'", () => {
      const p: ArchetypeParams = {
        archetype: "amrap-flat",
        params: { durationMin: 20 },
      };

      expect(formatArchetypeParams(p)).toEqual(["AMRAP 20 min"]);
    });
  });

  describe("time-window-outer", () => {
    it("renders '<start> → <end>'", () => {
      const p: ArchetypeParams = {
        archetype: "time-window-outer",
        params: { window: { startHhMm: "10:00", endHhMm: "11:30" } },
      };

      expect(formatArchetypeParams(p)).toEqual(["10:00 → 11:30"]);
    });
  });

  describe("composite-rounds-with-rest", () => {
    it("renders count + rest", () => {
      const p: ArchetypeParams = {
        archetype: "composite-rounds-with-rest",
        params: {
          count: 4,
          rest: makeRest({ duration: { value: 1, unit: "min" }, scope: "between_rounds" }),
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["4 rounds", "rest 1 min between rounds"]);
    });

    it("renders range count + rest", () => {
      const p: ArchetypeParams = {
        archetype: "composite-rounds-with-rest",
        params: {
          count: { min: 3, max: 5 },
          rest: makeRest({ duration: { value: 1, unit: "min" }, scope: "between_rounds" }),
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["3–5 rounds", "rest 1 min between rounds"]);
    });
  });

  describe("composite-intervals-then-rounds", () => {
    it("renders intervals / rest / then-rounds tokens", () => {
      const p: ArchetypeParams = {
        archetype: "composite-intervals-then-rounds",
        params: {
          intervalsCount: 4,
          restMin: 2,
          innerRounds: 3,
          preambleExercise: { form: "atomic", exerciseId: "ckabc1234567890abcdef012345" },
          preambleReps: { kind: "count", value: 5 },
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["4 intervals", "rest 2 min", "then 3 rounds"]);
    });
  });

  describe("composite-intervals-work-rest-fixed", () => {
    it("renders a single compound work/rest line", () => {
      const p: ArchetypeParams = {
        archetype: "composite-intervals-work-rest-fixed",
        params: { intervalsCount: 6, workMin: 3, restMin: 1 },
      };

      expect(formatArchetypeParams(p)).toEqual(["6 × 3 min work / 1 min rest"]);
    });
  });

  describe("composite-intervals-work-rest-progressive", () => {
    it("renders the work/off line and the progressive seed", () => {
      const p: ArchetypeParams = {
        archetype: "composite-intervals-work-rest-progressive",
        params: { sets: 5, workMin: 3, offMin: 1, progressiveSeed: "+5%" },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 × 3/1 min · progressive", "+5%"]);
    });
  });

  describe("composite-intervals-on-off-max-tail", () => {
    it("renders the on/off + max tail compound line", () => {
      const p: ArchetypeParams = {
        archetype: "composite-intervals-on-off-max-tail",
        params: {
          intervals: 5,
          onMin: 2,
          offMin: 1,
          tailExerciseId: "ckabc1234567890abcdef012345",
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 × 2on/1off + max tail"]);
    });
  });

  describe("composite-rolling-rounds", () => {
    it("renders 'every X min · Y rounds · Z min total'", () => {
      const p: ArchetypeParams = {
        archetype: "composite-rolling-rounds",
        params: { everyNthMin: 2, rounds: 10, totalMin: 20 },
      };

      expect(formatArchetypeParams(p)).toEqual(["every 2 min · 10 rounds · 20 min total"]);
    });
  });

  describe("emom-nested-per-minute", () => {
    it("renders the duration line only when rounds is undefined", () => {
      const p: ArchetypeParams = {
        archetype: "emom-nested-per-minute",
        params: { durationMin: 12 },
      };

      expect(formatArchetypeParams(p)).toEqual(["EMOM 12 min"]);
    });

    it("appends '<rounds> rounds' when set", () => {
      const p: ArchetypeParams = {
        archetype: "emom-nested-per-minute",
        params: { durationMin: 12, rounds: 4 },
      };

      expect(formatArchetypeParams(p)).toEqual(["EMOM 12 min", "4 rounds"]);
    });
  });

  describe("emom-sub-minute-slot", () => {
    it("renders single slot as 'min N'", () => {
      const p: ArchetypeParams = {
        archetype: "emom-sub-minute-slot",
        params: { slot: { kind: "single", minute: 4 } },
      };

      expect(formatArchetypeParams(p)).toEqual(["min 4"]);
    });

    it("renders grouped slot as 'mins N, M, ...'", () => {
      const p: ArchetypeParams = {
        archetype: "emom-sub-minute-slot",
        params: { slot: { kind: "grouped", minutes: [2, 4, 6] } },
      };

      expect(formatArchetypeParams(p)).toEqual(["mins 2, 4, 6"]);
    });
  });

  describe.each([["nested-rounds-over-rounds"], ["nested-rounds-over-parallel-ladder"]] as const)(
    "%s",
    (archetype) => {
      it("renders exact outerCount", () => {
        const p: ArchetypeParams = { archetype, params: { outerCount: 3 } };

        expect(formatArchetypeParams(p)).toEqual(["3 outer rounds"]);
      });

      it("renders range outerCount", () => {
        const p: ArchetypeParams = {
          archetype,
          params: { outerCount: { min: 2, max: 4 } },
        };

        expect(formatArchetypeParams(p)).toEqual(["2–4 outer rounds"]);
      });
    },
  );

  describe("nested-composite-rounds-over-ladder", () => {
    it("renders outerCount and rest", () => {
      const p: ArchetypeParams = {
        archetype: "nested-composite-rounds-over-ladder",
        params: {
          outerCount: 4,
          rest: makeRest({ duration: { value: 2, unit: "min" }, scope: "between_rounds" }),
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["4 outer rounds", "rest 2 min between rounds"]);
    });
  });

  describe("named-themed-sets", () => {
    it("renders count + quoted theme", () => {
      const p: ArchetypeParams = {
        archetype: "named-themed-sets",
        params: { count: 5, theme: "Hero workouts" },
      };

      expect(formatArchetypeParams(p)).toEqual(["5 sets", "'Hero workouts'"]);
    });

    it("renders range count + quoted theme", () => {
      const p: ArchetypeParams = {
        archetype: "named-themed-sets",
        params: { count: { min: 3, max: 5 }, theme: "Mixed" },
      };

      expect(formatArchetypeParams(p)).toEqual(["3–5 sets", "'Mixed'"]);
    });
  });

  describe("named-exercise-program", () => {
    it("renders the programKind verbatim when it has no underscores (D-17)", () => {
      const p: ArchetypeParams = {
        archetype: "named-exercise-program",
        params: {
          exerciseId: "ckabc1234567890abcdef012345",
          program: {
            programKind: "wave",
            stages: [{ reps: 5 }],
          },
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["wave"]);
    });

    it("translates underscores in compound programKind values", () => {
      const p: ArchetypeParams = {
        archetype: "named-exercise-program",
        params: {
          exerciseId: "ckabc1234567890abcdef012345",
          program: {
            programKind: "drop_set",
            stages: [{ reps: 5 }],
          },
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["drop set"]);
    });
  });

  describe("single-line-total-counter", () => {
    it("renders the static 'total counter' label", () => {
      const p: ArchetypeParams = {
        archetype: "single-line-total-counter",
        params: { totalFlag: true },
      };

      expect(formatArchetypeParams(p)).toEqual(["total counter"]);
    });
  });

  describe("run-distance", () => {
    it("renders a value with unit", () => {
      const p: ArchetypeParams = {
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km", value: 5 } },
      };

      expect(formatArchetypeParams(p)).toEqual(["Run 5 km"]);
    });

    it("renders a range with unit", () => {
      const p: ArchetypeParams = {
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km", range: { min: 3, max: 5 } } },
      };

      expect(formatArchetypeParams(p)).toEqual(["Run 3–5 km"]);
    });

    it("renders the bare 'Run' fallback when distance is undefined", () => {
      const p: ArchetypeParams = {
        archetype: "run-distance",
        params: { modality: "RUN" },
      };

      expect(formatArchetypeParams(p)).toEqual(["Run"]);
    });

    it("renders the bare 'Run' fallback when neither value nor range is set", () => {
      const p: ArchetypeParams = {
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km" } },
      };

      expect(formatArchetypeParams(p)).toEqual(["Run"]);
    });
  });

  describe("super-set", () => {
    it("renders pairs / rounds without restBetweenPairs", () => {
      const p: ArchetypeParams = {
        archetype: "super-set",
        params: {
          pairs: [
            { label: "A", schemaRows: ["ckabc1234567890abcdef012345"] },
            { label: "B", schemaRows: ["ckxyz1234567890abcdef012345"] },
          ],
          rounds: 4,
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["2 pairs", "4 rounds"]);
    });

    it("appends restBetweenPairs when set", () => {
      const p: ArchetypeParams = {
        archetype: "super-set",
        params: {
          pairs: [
            { label: "A", schemaRows: ["ckabc1234567890abcdef012345"] },
            { label: "B", schemaRows: ["ckxyz1234567890abcdef012345"] },
          ],
          rounds: 4,
          restBetweenPairs: makeRest({
            duration: { value: 30, unit: "sec" },
            scope: "between_sets",
          }),
        },
      };

      expect(formatArchetypeParams(p)).toEqual(["2 pairs", "4 rounds", "rest 30s between sets"]);
    });
  });

  describe.each([
    ["single-line-with-then-connector"],
    ["single-line-bare"],
    ["flat-list-headerless"],
    ["pull-ups-dips-cycle"],
    ["placeholder-body"],
    ["practice-list"],
    ["url-only-body"],
  ] as const)("empty-params archetype %s", (archetype) => {
    it("returns an empty array", () => {
      const p: ArchetypeParams = { archetype, params: {} };

      expect(formatArchetypeParams(p)).toEqual([]);
    });
  });
});
