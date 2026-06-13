import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  composeRowGroup,
  countReps,
  eachArm,
  explicitSplit,
  restBetweenRounds,
  rounds,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_FIXED_MIN_3 = restBetweenRounds({ value: 3, unit: "min" }, "fixed");

export const BLOCK_COMPOUND_ROWS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-077",
  order: 8,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Compound + Sandwich + OrAlt rows",
        rows: [
          mkRow(1, EX.dbStrictPress, {
            load: absoluteLoad({ count: 2, kg: 15 }),
            reps: countReps(5),
            side: explicitSplit("left"),
            notes: ["before METCON"],
            refId: "cmp-l-1",
          }),
          mkRow(2, EX.dbPushPress, {
            load: absoluteLoad({ count: 2, kg: 15 }),
            reps: countReps(5),
            side: explicitSplit("left"),
            refId: "cmp-l-2",
          }),
          mkRow(3, EX.dbStrictPress, {
            load: absoluteLoad({ count: 2, kg: 15 }),
            reps: countReps(5),
            side: explicitSplit("right"),
            notes: ["after BAR DIPS complex"],
            refId: "cmp-r-1",
          }),
          mkRow(4, EX.dbPushPress, {
            load: absoluteLoad({ count: 2, kg: 15 }),
            reps: countReps(5),
            side: explicitSplit("right"),
            refId: "cmp-r-2",
          }),
          mkRow(5, EX.dbStrictPress, {
            reps: countReps(5),
            side: eachArm(8),
            notes: [
              "Sandwich: 5 strict press / 10 curl / 5 strict press",
              "before WARMUP, after METCON",
            ],
            refId: "sand-1",
          }),
          mkRow(6, EX.dbCurl, { reps: countReps(10), side: eachArm(8), refId: "sand-2" }),
          mkRow(7, EX.dbStrictPress, { reps: countReps(5), side: eachArm(8), refId: "sand-3" }),
          mkRow(8, EX.strictPullUp, {
            load: bodyweightLoad(),
            reps: countReps(5),
            notes: ["once, before METCON"],
            refId: "or1-a",
          }),
          mkRow(9, EX.ringRow, { reps: countReps(8), refId: "or1-b" }),
          mkRow(10, EX.backSquat, {
            load: absoluteLoad({ count: 1, kg: 80 }),
            reps: countReps(5),
            refId: "or2-a",
          }),
          mkRow(11, EX.dbGobletSquat, { reps: countReps(8), refId: "or2-b" }),
          mkRow(12, EX.run, { reps: unitBoundReps({ unit: "km", value: 5 }), refId: "or3-a" }),
          mkRow(13, EX.rowErg, { reps: unitBoundReps({ unit: "min", value: 25 }), refId: "or3-b" }),
          mkRow(14, EX.placeholderShoulderAccessory, {}),
        ],
        rowGroups: [
          composeRowGroup({
            refId: "cmp-left",
            notes: ["DB strict press + push press (left)"],
            memberRowRefIds: ["cmp-l-1", "cmp-l-2"],
          }),
          composeRowGroup({
            refId: "cmp-right",
            notes: ["DB strict press + push press (right)"],
            memberRowRefIds: ["cmp-r-1", "cmp-r-2"],
          }),
          composeRowGroup({
            refId: "sandwich",
            notes: ["Sandwich"],
            memberRowRefIds: ["sand-1", "sand-2", "sand-3"],
          }),
          composeRowGroup({
            refId: "or-1",
            notes: ["OR", "scale down"],
            memberRowRefIds: ["or1-a", "or1-b"],
          }),
          composeRowGroup({
            refId: "or-2",
            notes: ["OR", "equipment substitute"],
            memberRowRefIds: ["or2-a", "or2-b"],
          }),
          composeRowGroup({
            refId: "or-3",
            notes: ["OR", "coach choice"],
            memberRowRefIds: ["or3-a", "or3-b"],
          }),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};

export const BLOCK_PER_ROUND_MARKERS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-183",
  order: 9,
  labels: [LBL.gymnastics],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "footnote-bearing rounds",
        notes: ["10 min cap"],
        rows: [
          mkRow(1, EX.strictHspu, { load: bodyweightLoad(), reps: countReps(5) }),
          mkRow(2, EX.strictHspu, { reps: countReps(5), notes: ["** after each round"] }),
          mkRow(3, EX.toesToBar, { reps: countReps(10), notes: ["* after each set"] }),
          mkRow(4, EX.strictHspu, {
            reps: countReps(5),
            notes: ["** after each GYMNASTICS round"],
          }),
        ],
      },
      { ...rounds(5), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
    buildComposeNode(
      {
        order: 2,
        header: "then_n_rounds carrier",
        rows: [mkRow(1, EX.burpee, { reps: countReps(15) })],
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
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "implicit-label block",
        rows: [
          mkRow(1, EX.dbGobletSquat, {
            load: absoluteLoad({ count: 1, kg: 20 }),
            reps: countReps(15),
          }),
        ],
      },
      { ...rounds(2), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
  ],
};
