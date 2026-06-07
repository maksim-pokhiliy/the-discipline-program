import {
  absoluteLoad,
  afterEachRound,
  afterEachTypedRound,
  afterNamed,
  beforeNamed,
  beforeNamedAfterNamedComposite,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  cuidFromSeed,
  dualWeight,
  eachArm,
  explicitSplit,
  onlyOnceBefore,
  restBetweenRounds,
  rounds,
  singleWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_FIXED_MIN_3 = restBetweenRounds({ value: 3, unit: "min" }, "fixed");

const CMP_LEFT_REF = cuidFromSeed("wk2-tue-cmp-left");
const CMP_RIGHT_REF = cuidFromSeed("wk2-tue-cmp-right");

export const BLOCK_COMPOUND_ROWS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-077",
  order: 8,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Compound + Sandwich + OrAlt rows",
        rows: [
          mkRow(
            1,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "compound",
                compound: {
                  elements: [
                    { exerciseId: EX.dbStrictPress, reps: { kind: "count", value: 5 } },
                    { exerciseId: EX.dbPushPress, reps: { kind: "count", value: 5 } },
                  ],
                  sharedModifiers: { load: absoluteLoad(dualWeight(15)) },
                },
              },
            },
            {
              side: explicitSplit("left", CMP_LEFT_REF),
              refId: CMP_LEFT_REF,
              sequence: beforeNamed("METCON"),
            },
          ),
          mkRow(
            2,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "compound",
                compound: {
                  elements: [
                    { exerciseId: EX.dbStrictPress, reps: { kind: "count", value: 5 } },
                    { exerciseId: EX.dbPushPress, reps: { kind: "count", value: 5 } },
                  ],
                  sharedModifiers: { load: absoluteLoad(dualWeight(15)) },
                },
              },
            },
            {
              side: explicitSplit("right", CMP_RIGHT_REF),
              refId: CMP_RIGHT_REF,
              sequence: afterNamed("BAR DIPS complex"),
            },
          ),
          mkRow(
            3,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "sandwich",
                sandwich: {
                  opening: { exerciseId: EX.dbStrictPress, reps: { kind: "count", value: 5 } },
                  middle: { exerciseId: EX.dbCurl, reps: { kind: "count", value: 10 } },
                  closing: { exerciseId: EX.dbStrictPress, reps: { kind: "count", value: 5 } },
                },
              },
            },
            { sequence: beforeNamedAfterNamedComposite("WARMUP", "METCON"), side: eachArm(8) },
          ),
          mkRow(
            4,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "or_alternative",
                orAlternative: {
                  primaryExerciseId: EX.strictPullUp,
                  primaryReps: { kind: "count", value: 5 },
                  alternativeExerciseId: EX.ringRow,
                  alternativeReps: { kind: "count", value: 8 },
                  purpose: "scale_down",
                },
              },
            },
            { load: bodyweightLoad(), sequence: onlyOnceBefore("METCON") },
          ),
          mkRow(
            5,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "or_alternative",
                orAlternative: {
                  primaryExerciseId: EX.backSquat,
                  primaryReps: { kind: "count", value: 5 },
                  alternativeExerciseId: EX.dbGobletSquat,
                  alternativeReps: { kind: "count", value: 8 },
                  purpose: "equipment_substitute",
                },
              },
            },
            { load: absoluteLoad(singleWeight(80)) },
          ),
          mkRow(
            6,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "or_alternative",
                orAlternative: {
                  primaryExerciseId: EX.run,
                  primaryReps: { kind: "unit_bound", unit: "km", value: 5 },
                  alternativeExerciseId: EX.rowErg,
                  alternativeReps: { kind: "unit_bound", unit: "min", value: 25 },
                  purpose: "coach_choice",
                },
              },
            },
            {},
          ),
          mkRow(
            7,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "placeholder_ref",
                placeholderExerciseId: EX.placeholderShoulderAccessory,
              },
            },
            {},
          ),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};

export const BLOCK_FOOTNOTES_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-183",
  order: 9,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: { min: 10, unit: "min" },
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "footnote-bearing rounds",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictHspu } },
            { load: bodyweightLoad(), reps: countReps(5) },
          ),
          mkRow(
            2,
            {
              rowKind: "FOOTNOTE",
              marker: "**",
              target: "each_round",
              content: {
                elements: [{ exerciseId: EX.strictHspu, reps: { kind: "count", value: 5 } }],
              },
            },
            { sequence: afterEachRound() },
          ),
          mkRow(
            3,
            {
              rowKind: "FOOTNOTE",
              marker: "*",
              target: "each_set",
              content: {
                elements: [{ exerciseId: EX.toesToBar, reps: { kind: "count", value: 10 } }],
              },
            },
            {},
          ),
          mkRow(
            4,
            {
              rowKind: "FOOTNOTE",
              marker: "**",
              target: "each_typed_round",
              content: {
                elements: [{ exerciseId: EX.strictHspu, reps: { kind: "count", value: 5 } }],
              },
              typeLabel: "GYMNASTICS",
            },
            { sequence: afterEachTypedRound("GYMNASTICS") },
          ),
        ],
      },
      { ...rounds(5), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
    buildComposeNode(
      {
        order: 2,
        header: "then_n_rounds carrier",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.burpee } },
            { reps: countReps(15) },
          ),
        ],
      },
      { ...rounds(4), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
  ],
};

export const BLOCK_IMPLICIT_LABEL_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-099",
  order: 10,
  labels: [],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "implicit-label block",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbGobletSquat } },
            { load: absoluteLoad(singleWeight(20)), reps: countReps(15) },
          ),
        ],
      },
      { ...rounds(2), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
  ],
};
