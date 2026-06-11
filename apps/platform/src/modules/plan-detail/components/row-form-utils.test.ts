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
const VALID_REST_SLOT = {};

describe("parseRowPayload accepts the simple in-scope kinds with the full discriminated arm (MT-6)", () => {
  it("returns ok with the REST arm including rowKind", () => {
    const result = parseRowPayload("REST", VALID_REST);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "REST", ...VALID_REST });
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
});

describe("parseRowPayload never throws on hostile input (MT-5)", () => {
  const HOSTILE: unknown[] = [null, undefined, [1, 2, 3], "hello", 42, {}];

  const IN_SCOPE_KINDS = ["REST", "EXERCISE", "PLACEHOLDER", "REST_SLOT"] as const;

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
  it("trims REST_SLOT notes and emits an empty payload input", () => {
    const result = assembleRowPayloadAndNotes("REST_SLOT", { notes: "  emom rest  " });

    expect(result.payloadInput).toEqual({});
    expect(result.notes).toBe("emom rest");
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

const PER_SET_EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq02";

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

describe("parseRowPayload accepts the PLACEHOLDER kind with the full discriminated arm (scenario 27)", () => {
  it("returns ok with the PLACEHOLDER arm carrying an exerciseId assignment", () => {
    const result = parseRowPayload("PLACEHOLDER", VALID_PLACEHOLDER);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "PLACEHOLDER", ...VALID_PLACEHOLDER });
    }
  });
});

describe("parseRowPayload maps the PLACEHOLDER invalid classes to the form-read path (scenario 27)", () => {
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
});

describe("assembleRowPayloadAndNotes for the PLACEHOLDER kind (scenario 27)", () => {
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
});
