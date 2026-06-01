import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { RestSpec } from "@repo/contracts/lms/_shared";

import { formatRestSpec } from "../lib/format-rest-spec";

import { assembleRowPayloadAndNotes, parseRowPayload, validateRowSiblings } from "./row-form-utils";

const VALID_REST_PARSED: RestSpec = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

const isFieldError = (node: unknown): node is FieldError =>
  typeof node === "object" && node !== null && "message" in node;

const readMessage = (node: unknown): string | undefined => {
  if (isFieldError(node) && typeof node.message === "string") {
    return node.message;
  }

  return undefined;
};

const readBranch = (node: unknown, key: string): unknown =>
  typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined;

const VALID_REST = {
  parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
  raw: "rest 90s between sets",
};
const VALID_LOAD = {
  load: { kind: "absolute", weight: { variant: "single", valueKg: 32 } },
  scope: "applies_to_all_preceding_rows",
};
const VALID_URL = {
  url: "https://youtu.be/abc",
  wrapped: true,
  appliesTo: "whole_schema",
};
const VALID_MARKER = { steps: [21, 15, 9] };
const VALID_REST_SLOT = {};

describe("parseRowPayload accepts the 5 in-scope kinds with the full discriminated arm (MT-6)", () => {
  it("returns ok with the REST arm including rowKind", () => {
    const result = parseRowPayload("REST", VALID_REST);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "REST", ...VALID_REST });
    }
  });

  it("returns ok with the STANDALONE_LOAD arm including rowKind", () => {
    const result = parseRowPayload("STANDALONE_LOAD", VALID_LOAD);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "STANDALONE_LOAD", ...VALID_LOAD });
    }
  });

  it("returns ok with the STANDALONE_URL arm including rowKind", () => {
    const result = parseRowPayload("STANDALONE_URL", VALID_URL);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "STANDALONE_URL", ...VALID_URL });
    }
  });

  it("returns ok with the INNER_LADDER_MARKER arm including rowKind", () => {
    const result = parseRowPayload("INNER_LADDER_MARKER", VALID_MARKER);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "INNER_LADDER_MARKER", ...VALID_MARKER });
    }
  });

  it("returns ok with the REST_SLOT arm and strips extra keys", () => {
    const result = parseRowPayload("REST_SLOT", { ...VALID_REST_SLOT, junk: 1, notes: "x" });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "REST_SLOT" });
    }
  });
});

describe("parseRowPayload maps each invalid class to the path the form reads (MT-6)", () => {
  it("routes a REST range_* duration with rangeMax <= value to error.parsed.duration.root (QA-01)", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 90, unit: "range_sec", rangeMax: 60 }, scope: "between_sets" },
      raw: "rest",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const duration = readBranch(result.error.parsed, "duration");

      expect(readMessage(readBranch(duration, "root"))).toBe(
        "rangeMax required when unit is range_*, must be > value; forbidden otherwise",
      );
    }
  });

  it("routes a REST non-positive duration value to error.parsed.duration.value", () => {
    const result = parseRowPayload("REST", {
      parsed: { duration: { value: 0, unit: "sec" }, scope: "between_sets" },
      raw: "rest",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const duration = readBranch(result.error.parsed, "duration");

      expect(readMessage(readBranch(duration, "value"))).toBe("Number must be greater than 0");
    }
  });

  it("routes a STANDALONE_LOAD percentage rangeMax <= value to error.load.root (QA-02)", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 70, rangeMax: 60, reference: { scope: "self" } },
      scope: "applies_to_all_preceding_rows",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "root"))).toBe(
        "percentage.rangeMax must be > value when set",
      );
    }
  });

  it("routes a STANDALONE_LOAD valueKg of 0 to error.load.weight.valueKg", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "absolute", weight: { variant: "single", valueKg: 0 } },
      scope: "applies_to_all_preceding_rows",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const weight = readBranch(result.error.load, "weight");

      expect(readMessage(readBranch(weight, "valueKg"))).toBe("Number must be greater than 0");
    }
  });

  it("routes a STANDALONE_LOAD percentage value above 200 to error.load.value", () => {
    const result = parseRowPayload("STANDALONE_LOAD", {
      load: { kind: "percentage", value: 250, reference: { scope: "self" } },
      scope: "applies_to_all_preceding_rows",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "value"))).toBe(
        "Number must be less than or equal to 200",
      );
    }
  });

  it("routes a STANDALONE_URL missing wrapped flag to error.wrapped", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.wrapped)).toBeDefined();
    }
  });

  it("routes a STANDALONE_URL non-boolean wrapped flag to error.wrapped", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      wrapped: "yes",
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.wrapped)).toBeDefined();
    }
  });

  it("routes a STANDALONE_URL non-url string to error.url", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "not a url",
      wrapped: true,
      appliesTo: "previous_exercise_row",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.url)).toBeDefined();
    }
  });

  it("routes a STANDALONE_URL unknown appliesTo to error.appliesTo", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "https://youtu.be/x",
      wrapped: true,
      appliesTo: "anywhere",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.appliesTo)).toBeDefined();
    }
  });

  it("routes an empty INNER_LADDER_MARKER steps array to the steps root", () => {
    const result = parseRowPayload("INNER_LADDER_MARKER", { steps: [] });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.steps, "root"))).toBeDefined();
    }
  });
});

describe("parseRowPayload never throws on hostile input (MT-5)", () => {
  const HOSTILE: unknown[] = [null, undefined, [1, 2, 3], "hello", 42, {}];

  const IN_SCOPE_KINDS = [
    "REST",
    "STANDALONE_LOAD",
    "STANDALONE_URL",
    "INNER_LADDER_MARKER",
    "REST_SLOT",
  ] as const;

  it.each(IN_SCOPE_KINDS.flatMap((rowKind) => HOSTILE.map((value) => ({ rowKind, value }))))(
    "returns ok:false without throwing for $rowKind with %o",
    ({ rowKind, value }) => {
      let result: ReturnType<typeof parseRowPayload> | undefined;

      expect(() => {
        result = parseRowPayload(rowKind, value);
      }).not.toThrow();

      if (rowKind === "REST_SLOT") {
        expect(result?.ok).toBe(true);
      } else {
        expect(result?.ok).toBe(false);
      }
    },
  );
});

describe("parseRowPayload javascript-URL tripwire (MT-17, QA-05 — deferred)", () => {
  it("CURRENTLY accepts a javascript: URL — flip to reject once the contract tightens", () => {
    const result = parseRowPayload("STANDALONE_URL", {
      url: "javascript:alert(1)",
      wrapped: true,
      appliesTo: "whole_schema",
    });

    expect(result.ok).toBe(true);
  });
});

describe("assembleRowPayloadAndNotes REST raw fallback and notes (MT-7)", () => {
  it("derives raw from formatRestSpec when raw is blank", () => {
    const result = assembleRowPayloadAndNotes("REST", {
      parsed: VALID_REST_PARSED,
      raw: "",
      notes: "",
    });

    expect(result.payloadInput).toEqual({
      parsed: VALID_REST_PARSED,
      raw: formatRestSpec(VALID_REST_PARSED),
    });
  });

  it("trims a non-blank raw rather than deriving it", () => {
    const result = assembleRowPayloadAndNotes("REST", {
      parsed: VALID_REST_PARSED,
      raw: "  rest two minutes  ",
      notes: "",
    });

    expect(result.payloadInput).toEqual({ parsed: VALID_REST_PARSED, raw: "rest two minutes" });
  });

  it("yields a blank raw when the parsed spec is malformed so parse rejects it", () => {
    const parsed = { duration: { value: -1, unit: "sec" }, scope: "between_sets" };
    const result = assembleRowPayloadAndNotes("REST", { parsed, raw: "", notes: "" });

    expect(result.payloadInput.raw).toBe("");
    expect(parseRowPayload("REST", result.payloadInput).ok).toBe(false);
  });

  it("trims REST notes to null when blank and keeps trimmed notes otherwise", () => {
    expect(
      assembleRowPayloadAndNotes("REST", { parsed: VALID_REST_PARSED, raw: "x", notes: "   " })
        .notes,
    ).toBeNull();
    expect(
      assembleRowPayloadAndNotes("REST", {
        parsed: VALID_REST_PARSED,
        raw: "x",
        notes: "  warm up  ",
      }).notes,
    ).toBe("warm up");
  });
});

describe("assembleRowPayloadAndNotes per-kind contract (MT-7)", () => {
  it("injects the STANDALONE_LOAD scope and trims its notes", () => {
    const load = { kind: "absolute", weight: { variant: "single", valueKg: 15 } };
    const result = assembleRowPayloadAndNotes("STANDALONE_LOAD", { load, notes: "  heavy  " });

    expect(result.payloadInput).toEqual({ load, scope: "applies_to_all_preceding_rows" });
    expect(result.notes).toBe("heavy");
  });

  it("trims REST_SLOT notes and emits an empty payload input", () => {
    const result = assembleRowPayloadAndNotes("REST_SLOT", { notes: "  emom rest  " });

    expect(result.payloadInput).toEqual({});
    expect(result.notes).toBe("emom rest");
  });

  it("forces notes:null for STANDALONE_URL even when a notes field is present", () => {
    const result = assembleRowPayloadAndNotes("STANDALONE_URL", {
      url: "https://x.com",
      wrapped: false,
      appliesTo: "whole_schema",
      notes: "ignored",
    });

    expect(result.payloadInput).toEqual({
      url: "https://x.com",
      wrapped: false,
      appliesTo: "whole_schema",
    });
    expect(result.notes).toBeNull();
  });

  it("forces notes:null for INNER_LADDER_MARKER", () => {
    const result = assembleRowPayloadAndNotes("INNER_LADDER_MARKER", { steps: [21] });

    expect(result.payloadInput).toEqual({ steps: [21] });
    expect(result.notes).toBeNull();
  });
});

const EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq01";

const fatExerciseValue = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  exercise: { form: "atomic", exerciseId: EXERCISE_ID },
  reps: { kind: "count", value: 5 },
  load: { kind: "percentage", value: 80, reference: { scope: "self" } },
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: "",
  ...overrides,
});

describe("assembleRowPayloadAndNotes EXERCISE branch (QA-MT10)", () => {
  it("returns the exercise payload plus the VO siblings", () => {
    const result = assembleRowPayloadAndNotes("EXERCISE", fatExerciseValue());

    expect(result.payloadInput).toEqual({ exercise: { form: "atomic", exerciseId: EXERCISE_ID } });
    expect(result.notes).toBeNull();
    expect(result.siblings).toEqual({
      reps: { kind: "count", value: 5 },
      load: { kind: "percentage", value: 80, reference: { scope: "self" } },
      side: null,
      tempo: null,
      position: null,
      intensity: null,
    });
  });

  it("collapses an opened-but-empty intensity override to null", () => {
    const result = assembleRowPayloadAndNotes("EXERCISE", fatExerciseValue({ intensity: {} }));

    expect(result.siblings?.intensity).toBeNull();
  });

  it("collapses an all-undefined intensity override to null", () => {
    const result = assembleRowPayloadAndNotes(
      "EXERCISE",
      fatExerciseValue({ intensity: { effortPercent: undefined, rpe: undefined } }),
    );

    expect(result.siblings?.intensity).toBeNull();
  });

  it("carries a set intensity axis through to the siblings", () => {
    const result = assembleRowPayloadAndNotes(
      "EXERCISE",
      fatExerciseValue({ intensity: { rpe: { value: 8 } } }),
    );

    expect(result.siblings?.intensity).toEqual({ rpe: { value: 8 } });
  });
});

describe("validateRowSiblings (QA-MT9)", () => {
  it("treats undefined siblings as a no-op ok with an empty value", () => {
    expect(validateRowSiblings(undefined)).toEqual({ ok: true, value: {} });
  });

  it("returns ok and echoes valid siblings including explicit nulls", () => {
    const result = validateRowSiblings({ position: "NEUTRAL_GRIP", side: null, tempo: null });

    expect(result).toEqual({
      ok: true,
      value: { position: "NEUTRAL_GRIP", side: null, tempo: null },
    });
  });

  it("routes a reps range with min >= max to error.reps.root", () => {
    const result = validateRowSiblings({ reps: { kind: "range", min: 10, max: 5 } });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.reps, "root"))).toBe(
        "range.min must be < range.max",
      );
    }
  });

  it("routes a reps count value of 0 to error.reps.value (QA-001 keying)", () => {
    const result = validateRowSiblings({ reps: { kind: "count", value: 0 } });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.reps, "value"))).toBe(
        "Number must be greater than 0",
      );
    }
  });

  it("routes a percentage rangeMax <= value to error.load.root", () => {
    const result = validateRowSiblings({
      load: { kind: "percentage", value: 70, rangeMax: 60, reference: { scope: "self" } },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.load, "root"))).toBe(
        "percentage.rangeMax must be > value when set",
      );
    }
  });

  it("routes a side countPerLimb of 0 to error.side.countPerLimb (QA-002 keying)", () => {
    const result = validateRowSiblings({ side: { kind: "each_leg", countPerLimb: 0 } });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.side, "countPerLimb"))).toBe(
        "Number must be greater than 0",
      );
    }
  });
});

const COMPOSITION_EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq01";
const PER_SET_EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq02";
const CONTENT_EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq03";

const VALID_FOOTNOTE = {
  marker: "*",
  target: "each_set",
  content: { elements: [{ exerciseId: CONTENT_EXERCISE_ID, reps: { kind: "count", value: 5 } }] },
};
const VALID_FOOTNOTE_TYPED = {
  marker: "**",
  target: "each_typed_round",
  content: { elements: [{ exerciseId: CONTENT_EXERCISE_ID, reps: { kind: "count", value: 5 } }] },
  typeLabel: "GYMNASTICS",
};
const VALID_PLACEHOLDER = {
  placeholder: {
    placeholderKind: "coach_choice_slot",
    text: "*DB exercise",
    perSetAssignments: {
      placeholderName: "DB",
      assignments: [{ setIndex: 1, exerciseId: PER_SET_EXERCISE_ID }],
    },
  },
};
const VALID_REP_DEFINITION = {
  equality: {
    form: "inline_equality",
    totalReps: 5,
    composition: [{ exerciseId: COMPOSITION_EXERCISE_ID, count: 5 }],
  },
};

describe("parseRowPayload accepts the 3 un-deferred kinds with the full discriminated arm (scenario 27)", () => {
  it("returns ok with the FOOTNOTE arm including rowKind for single-element content", () => {
    const result = parseRowPayload("FOOTNOTE", VALID_FOOTNOTE);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "FOOTNOTE", ...VALID_FOOTNOTE });
    }
  });

  it("returns ok with the FOOTNOTE arm carrying a typeLabel at each_typed_round", () => {
    const result = parseRowPayload("FOOTNOTE", VALID_FOOTNOTE_TYPED);

    expect(result.ok).toBe(true);

    if (result.ok && result.value.rowKind === "FOOTNOTE") {
      expect(result.value.typeLabel).toBe("GYMNASTICS");
    }
  });

  it("returns ok with the PLACEHOLDER arm carrying an exerciseId assignment", () => {
    const result = parseRowPayload("PLACEHOLDER", VALID_PLACEHOLDER);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "PLACEHOLDER", ...VALID_PLACEHOLDER });
    }
  });

  it("returns ok with the REP_DEFINITION inline_equality arm", () => {
    const result = parseRowPayload("REP_DEFINITION", VALID_REP_DEFINITION);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "REP_DEFINITION", ...VALID_REP_DEFINITION });
    }
  });
});

describe("parseRowPayload maps the 3 un-deferred invalid classes to the form-read path (scenario 27)", () => {
  it("routes a FOOTNOTE blank typeLabel to error.typeLabel", () => {
    const result = parseRowPayload("FOOTNOTE", { ...VALID_FOOTNOTE_TYPED, typeLabel: "" });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.typeLabel)).toBeDefined();
    }
  });

  it("routes a FOOTNOTE null-picker content element to error.content.elements.0.exerciseId", () => {
    const result = parseRowPayload("FOOTNOTE", {
      marker: "*",
      target: "each_set",
      content: { elements: [{ exerciseId: null, reps: { kind: "count", value: 5 } }] },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const content = readBranch(result.error.content, "elements");
      const first = readBranch(content, "0");

      expect(readMessage(readBranch(first, "exerciseId"))).toBeDefined();
    }
  });

  it("routes a PLACEHOLDER empty text to error.placeholder.text", () => {
    const result = parseRowPayload("PLACEHOLDER", {
      placeholder: { placeholderKind: "muscle_group_reference", text: "" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.placeholder, "text"))).toBeDefined();
    }
  });

  it("routes a PLACEHOLDER null-picker assignment to the leaf exerciseId, not the root", () => {
    const result = parseRowPayload("PLACEHOLDER", {
      placeholder: {
        placeholderKind: "coach_choice_slot",
        text: "*DB exercise",
        perSetAssignments: {
          placeholderName: "DB",
          assignments: [{ setIndex: 1, exerciseId: null }],
        },
      },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const perSet = readBranch(result.error.placeholder, "perSetAssignments");
      const assignments = readBranch(perSet, "assignments");
      const first = readBranch(assignments, "0");

      expect(readMessage(readBranch(first, "exerciseId"))).toBeDefined();
      expect(readMessage(readBranch(first, "root"))).toBeUndefined();
    }
  });

  it("routes a PLACEHOLDER empty assignments array to the assignments root", () => {
    const result = parseRowPayload("PLACEHOLDER", {
      placeholder: {
        placeholderKind: "coach_choice_slot",
        text: "*DB exercise",
        perSetAssignments: { placeholderName: "DB", assignments: [] },
      },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const perSet = readBranch(result.error.placeholder, "perSetAssignments");
      const assignments = readBranch(perSet, "assignments");

      expect(readMessage(readBranch(assignments, "root"))).toBeDefined();
    }
  });

  it("routes a REP_DEFINITION empty composition array to error.equality.composition.root", () => {
    const result = parseRowPayload("REP_DEFINITION", {
      equality: { form: "inline_equality", totalReps: 5, composition: [] },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const composition = readBranch(result.error.equality, "composition");

      expect(readMessage(readBranch(composition, "root"))).toBeDefined();
    }
  });

  it("routes a REP_DEFINITION non-positive totalReps to error.equality.totalReps", () => {
    const result = parseRowPayload("REP_DEFINITION", {
      equality: {
        form: "inline_equality",
        totalReps: 0,
        composition: [{ exerciseId: COMPOSITION_EXERCISE_ID, count: 5 }],
      },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.equality, "totalReps"))).toBeDefined();
    }
  });
});

describe("assembleRowPayloadAndNotes for the 3 un-deferred kinds (scenario 27)", () => {
  it("trims the FOOTNOTE notes carried in its value", () => {
    const result = assembleRowPayloadAndNotes("FOOTNOTE", {
      ...VALID_FOOTNOTE,
      notes: "  see below  ",
    });

    expect(result.notes).toBe("see below");
  });

  it("nulls the FOOTNOTE notes when the value carries a blank string", () => {
    const result = assembleRowPayloadAndNotes("FOOTNOTE", { ...VALID_FOOTNOTE, notes: "   " });

    expect(result.notes).toBeNull();
  });

  it("carries the PLACEHOLDER notes through assemble via the opaque carry", () => {
    const result = assembleRowPayloadAndNotes("PLACEHOLDER", {
      ...VALID_PLACEHOLDER,
      notes: "keep me",
    });

    expect(result.notes).toBe("keep me");
  });

  it("nulls the PLACEHOLDER notes when no notes key is present", () => {
    const result = assembleRowPayloadAndNotes("PLACEHOLDER", VALID_PLACEHOLDER);

    expect(result.notes).toBeNull();
  });

  it("carries the REP_DEFINITION notes through assemble via the opaque carry", () => {
    const result = assembleRowPayloadAndNotes("REP_DEFINITION", {
      ...VALID_REP_DEFINITION,
      notes: "keep me",
    });

    expect(result.notes).toBe("keep me");
  });

  it("nulls the REP_DEFINITION notes when no notes key is present", () => {
    const result = assembleRowPayloadAndNotes("REP_DEFINITION", VALID_REP_DEFINITION);

    expect(result.notes).toBeNull();
  });
});
