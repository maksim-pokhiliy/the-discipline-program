import { describe, expect, it } from "vitest";

import {
  compoundRowSchema,
  cyclicalCompoundSchema,
  exerciseFormSchema,
  footnoteContentSchema,
  orAlternativeSchema,
  perSetSubstitutionAssignmentSchema,
  perSetSubstitutionSchema,
  placeholderPayloadSchema,
  sandwichCompoundSchema,
} from "./compounds";
import { OR_ALTERNATIVE_PURPOSES, PLACEHOLDER_KINDS } from "./enums";

const CUID_A = "ck1234567890123456789012";
const CUID_B = "ck0987654321098765432109";
const CUID_C = "ckabcdefghijklmnopqrstuv";

const REP_A = { kind: "count", value: 5 } as const;
const REP_B = { kind: "count", value: 3 } as const;
const REP_C = { kind: "count", value: 1 } as const;

describe("compoundRowSchema", () => {
  it("accepts 2-element compound row", () => {
    expect(
      compoundRowSchema.safeParse({
        elements: [
          { exerciseId: CUID_A, reps: REP_A },
          { exerciseId: CUID_B, reps: REP_B },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts sharedModifiers with load + tempo", () => {
    expect(
      compoundRowSchema.safeParse({
        elements: [
          { exerciseId: CUID_A, reps: REP_A },
          { exerciseId: CUID_B, reps: REP_B },
        ],
        sharedModifiers: {
          load: { kind: "bodyweight" },
          tempo: { slowEccentric: { durationSec: 3 } },
        },
      }).success,
    ).toBe(true);
  });

  it("rejects 1-element compound row (semantic = atomic)", () => {
    expect(
      compoundRowSchema.safeParse({ elements: [{ exerciseId: CUID_A, reps: REP_A }] }).success,
    ).toBe(false);
  });

  it("rejects empty elements array", () => {
    expect(compoundRowSchema.safeParse({ elements: [] }).success).toBe(false);
  });

  it("rejects element with invalid exerciseId", () => {
    expect(
      compoundRowSchema.safeParse({
        elements: [
          { exerciseId: "abc", reps: REP_A },
          { exerciseId: CUID_B, reps: REP_B },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts element with optional side", () => {
    expect(
      compoundRowSchema.safeParse({
        elements: [
          { exerciseId: CUID_A, reps: REP_A, side: { kind: "each_arm" } },
          { exerciseId: CUID_B, reps: REP_B },
        ],
      }).success,
    ).toBe(true);
  });
});

describe("cyclicalCompoundSchema", () => {
  it("accepts cycles array with secondaryReps", () => {
    expect(
      cyclicalCompoundSchema.safeParse({
        primaryExerciseId: CUID_A,
        secondaryExerciseId: CUID_B,
        cycles: [{ secondaryReps: 5 }, { secondaryReps: 3 }],
      }).success,
    ).toBe(true);
  });

  it("accepts cycle with optional primaryReps", () => {
    expect(
      cyclicalCompoundSchema.safeParse({
        primaryExerciseId: CUID_A,
        secondaryExerciseId: CUID_B,
        cycles: [{ primaryReps: 1, secondaryReps: 5 }],
      }).success,
    ).toBe(true);
  });

  it("accepts optional rotation step exerciseId", () => {
    expect(
      cyclicalCompoundSchema.safeParse({
        primaryExerciseId: CUID_A,
        secondaryExerciseId: CUID_B,
        cycles: [{ secondaryReps: 5 }],
        optionalRotationStepExerciseId: CUID_C,
      }).success,
    ).toBe(true);
  });

  it("rejects empty cycles", () => {
    expect(
      cyclicalCompoundSchema.safeParse({
        primaryExerciseId: CUID_A,
        secondaryExerciseId: CUID_B,
        cycles: [],
      }).success,
    ).toBe(false);
  });

  it("rejects invalid primaryExerciseId", () => {
    expect(
      cyclicalCompoundSchema.safeParse({
        primaryExerciseId: "abc",
        secondaryExerciseId: CUID_B,
        cycles: [{ secondaryReps: 5 }],
      }).success,
    ).toBe(false);
  });
});

describe("sandwichCompoundSchema", () => {
  it("accepts opening + middle + closing", () => {
    expect(
      sandwichCompoundSchema.safeParse({
        opening: { exerciseId: CUID_A, reps: REP_A },
        middle: { exerciseId: CUID_B, reps: REP_B },
        closing: { exerciseId: CUID_C, reps: REP_C },
      }).success,
    ).toBe(true);
  });

  it("accepts sharedModifiers with tempo + load", () => {
    expect(
      sandwichCompoundSchema.safeParse({
        opening: { exerciseId: CUID_A, reps: REP_A },
        middle: { exerciseId: CUID_B, reps: REP_B },
        closing: { exerciseId: CUID_C, reps: REP_C },
        sharedModifiers: {
          tempo: { slowEccentric: { durationSec: 2 } },
          load: { kind: "bodyweight" },
        },
      }).success,
    ).toBe(true);
  });

  it("rejects missing middle", () => {
    expect(
      sandwichCompoundSchema.safeParse({
        opening: { exerciseId: CUID_A, reps: REP_A },
        closing: { exerciseId: CUID_C, reps: REP_C },
      }).success,
    ).toBe(false);
  });
});

describe("orAlternativeSchema", () => {
  it("accepts canonical 5 fields", () => {
    expect(
      orAlternativeSchema.safeParse({
        primaryExerciseId: CUID_A,
        primaryReps: REP_A,
        alternativeExerciseId: CUID_B,
        alternativeReps: REP_B,
        purpose: "scale_down",
      }).success,
    ).toBe(true);
  });

  it("accepts all 3 OR_ALTERNATIVE_PURPOSES", () => {
    for (const purpose of OR_ALTERNATIVE_PURPOSES) {
      expect(
        orAlternativeSchema.safeParse({
          primaryExerciseId: CUID_A,
          primaryReps: REP_A,
          alternativeExerciseId: CUID_B,
          alternativeReps: REP_B,
          purpose,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects invalid primaryExerciseId", () => {
    expect(
      orAlternativeSchema.safeParse({
        primaryExerciseId: "abc",
        primaryReps: REP_A,
        alternativeExerciseId: CUID_B,
        alternativeReps: REP_B,
        purpose: "scale_down",
      }).success,
    ).toBe(false);
  });
});

describe("perSetSubstitutionAssignmentSchema", () => {
  it("accepts exerciseId only", () => {
    expect(
      perSetSubstitutionAssignmentSchema.safeParse({ setIndex: 1, exerciseId: CUID_A }).success,
    ).toBe(true);
  });

  it("accepts inlineCompound only", () => {
    expect(
      perSetSubstitutionAssignmentSchema.safeParse({
        setIndex: 2,
        inlineCompound: {
          elements: [
            { exerciseId: CUID_A, reps: REP_A },
            { exerciseId: CUID_B, reps: REP_B },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("rejects both exerciseId and inlineCompound (XOR)", () => {
    expect(
      perSetSubstitutionAssignmentSchema.safeParse({
        setIndex: 1,
        exerciseId: CUID_A,
        inlineCompound: {
          elements: [
            { exerciseId: CUID_A, reps: REP_A },
            { exerciseId: CUID_B, reps: REP_B },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it("rejects neither exerciseId nor inlineCompound (XOR)", () => {
    expect(perSetSubstitutionAssignmentSchema.safeParse({ setIndex: 1 }).success).toBe(false);
  });

  it("rejects zero setIndex", () => {
    expect(
      perSetSubstitutionAssignmentSchema.safeParse({ setIndex: 0, exerciseId: CUID_A }).success,
    ).toBe(false);
  });
});

describe("perSetSubstitutionSchema", () => {
  it("accepts placeholderName + non-empty assignments", () => {
    expect(
      perSetSubstitutionSchema.safeParse({
        placeholderName: "X",
        assignments: [{ setIndex: 1, exerciseId: CUID_A }],
      }).success,
    ).toBe(true);
  });

  it("rejects empty assignments", () => {
    expect(
      perSetSubstitutionSchema.safeParse({ placeholderName: "X", assignments: [] }).success,
    ).toBe(false);
  });

  it("rejects empty placeholderName", () => {
    expect(
      perSetSubstitutionSchema.safeParse({
        placeholderName: "",
        assignments: [{ setIndex: 1, exerciseId: CUID_A }],
      }).success,
    ).toBe(false);
  });
});

describe("placeholderPayloadSchema", () => {
  it("accepts all 3 PLACEHOLDER_KINDS", () => {
    for (const placeholderKind of PLACEHOLDER_KINDS) {
      expect(
        placeholderPayloadSchema.safeParse({ placeholderKind, text: "biceps work" }).success,
      ).toBe(true);
    }
  });

  it("rejects empty text", () => {
    expect(
      placeholderPayloadSchema.safeParse({
        placeholderKind: "muscle_group_reference",
        text: "",
      }).success,
    ).toBe(false);
  });

  it("accepts optional perSetAssignments", () => {
    expect(
      placeholderPayloadSchema.safeParse({
        placeholderKind: "coach_choice_slot",
        text: "choose",
        perSetAssignments: {
          placeholderName: "X",
          assignments: [{ setIndex: 1, exerciseId: CUID_A }],
        },
      }).success,
    ).toBe(true);
  });

  it("accepts optional pairedConcreteRowId", () => {
    expect(
      placeholderPayloadSchema.safeParse({
        placeholderKind: "purpose_category",
        text: "hip",
        pairedConcreteRowId: CUID_A,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid pairedConcreteRowId", () => {
    expect(
      placeholderPayloadSchema.safeParse({
        placeholderKind: "purpose_category",
        text: "hip",
        pairedConcreteRowId: "abc",
      }).success,
    ).toBe(false);
  });
});

describe("exerciseFormSchema", () => {
  it("accepts atomic form", () => {
    expect(exerciseFormSchema.safeParse({ form: "atomic", exerciseId: CUID_A }).success).toBe(true);
  });

  it("accepts compound form", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "compound",
        compound: {
          elements: [
            { exerciseId: CUID_A, reps: REP_A },
            { exerciseId: CUID_B, reps: REP_B },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("accepts cyclical form", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "cyclical",
        cyclical: {
          primaryExerciseId: CUID_A,
          secondaryExerciseId: CUID_B,
          cycles: [{ secondaryReps: 5 }],
        },
      }).success,
    ).toBe(true);
  });

  it("accepts sandwich form", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "sandwich",
        sandwich: {
          opening: { exerciseId: CUID_A, reps: REP_A },
          middle: { exerciseId: CUID_B, reps: REP_B },
          closing: { exerciseId: CUID_C, reps: REP_C },
        },
      }).success,
    ).toBe(true);
  });

  it("accepts or_alternative form", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "or_alternative",
        orAlternative: {
          primaryExerciseId: CUID_A,
          primaryReps: REP_A,
          alternativeExerciseId: CUID_B,
          alternativeReps: REP_B,
          purpose: "coach_choice",
        },
      }).success,
    ).toBe(true);
  });

  it("accepts placeholder_ref form", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "placeholder_ref",
        placeholderExerciseId: CUID_A,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown form", () => {
    expect(exerciseFormSchema.safeParse({ form: "mystery", exerciseId: CUID_A }).success).toBe(
      false,
    );
  });

  it("rejects nested invalid compound (1 element)", () => {
    expect(
      exerciseFormSchema.safeParse({
        form: "compound",
        compound: { elements: [{ exerciseId: CUID_A, reps: REP_A }] },
      }).success,
    ).toBe(false);
  });

  it("rejects atomic with invalid exerciseId", () => {
    expect(exerciseFormSchema.safeParse({ form: "atomic", exerciseId: "abc" }).success).toBe(false);
  });
});

describe("footnoteContentSchema", () => {
  it("accepts empty elements (note-only footnote, C0-004)", () => {
    expect(footnoteContentSchema.safeParse({ elements: [] }).success).toBe(true);
  });

  it("accepts single-element footnote content", () => {
    expect(
      footnoteContentSchema.safeParse({
        elements: [{ exerciseId: CUID_A, reps: REP_A }],
      }).success,
    ).toBe(true);
  });

  it("accepts multi-element footnote content with sharedModifiers", () => {
    expect(
      footnoteContentSchema.safeParse({
        elements: [
          { exerciseId: CUID_A, reps: REP_A },
          { exerciseId: CUID_B, reps: REP_B },
        ],
        sharedModifiers: { load: { kind: "bodyweight" } },
      }).success,
    ).toBe(true);
  });

  it("rejects elements with invalid element shape (non-cuid exerciseId)", () => {
    expect(
      footnoteContentSchema.safeParse({
        elements: [{ exerciseId: "abc", reps: REP_A }],
      }).success,
    ).toBe(false);
  });
});
