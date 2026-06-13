import {
  absoluteLoad,
  buildComposeNode,
  byProfileLoad,
  composeRowGroup,
  countReps,
  rounds,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL, MOD } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_WEIGHT_VARIANTS_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-119",
  order: 2,
  labels: [LBL.strength, LBL.accessory],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "weight variants showcase",
        rows: [
          mkRow(1, EX.dbRow, {
            load: absoluteLoad({ count: 2, kg: 22.5 }),
            reps: countReps(10),
            modifierRefs: [MOD.handsOnDB],
          }),
          mkRow(2, EX.dbRenegadeRow, {
            load: absoluteLoad({ count: 1, kg: 24 }),
            reps: countReps(5),
            modifierRefs: [MOD.handsOnDB],
            refId: "st-1",
          }),
          mkRow(3, EX.dbRenegadeRow, {
            load: absoluteLoad({ count: 1, kg: 15 }),
            reps: countReps(10),
            refId: "st-2",
          }),
          mkRow(4, EX.overheadSquat, {
            load: byProfileLoad([
              { label: "M", kg: 50 },
              { label: "F", kg: 30 },
            ]),
            reps: countReps(6),
            modifierRefs: [MOD.handsOnDB, MOD.neutralGrip],
          }),
          mkRow(5, EX.dbBenchPress, {
            load: absoluteLoad({ count: 1, kg: 22.5 }),
            reps: countReps(8),
            modifierRefs: [MOD.neutralGrip, MOD.leftArmWorking, MOD.passiveHoldInUp],
          }),
          mkRow(6, EX.kbSwing, {
            load: absoluteLoad({ count: 1, kg: 24 }),
            reps: countReps(20),
            modifierRefs: [MOD.withoutBench, MOD.toParallel],
          }),
        ],
        rowGroups: [
          composeRowGroup({
            refId: "split-tier-group",
            notes: ["5 KB 24 + 10 DB 15"],
            memberRowRefIds: ["st-1", "st-2"],
          }),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};

export const BLOCK_PLACEHOLDER_BODY_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-152",
  order: 3,
  labels: [LBL.accessory],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "placeholder body",
        rows: [
          mkRow(1, EX.placeholderBicepsTriceps, {
            reps: countReps(12),
            modifierRefs: [MOD.fromBox],
          }),
          mkRow(2, EX.placeholderAbs, {
            reps: countReps(15),
            modifierRefs: [MOD.fromBoxOrSofa],
          }),
          mkRow(3, EX.placeholderCoachChoice, {
            reps: countReps(10),
            modifierRefs: [MOD.fromBoxOrSofa],
            refId: "ps-slot",
          }),
          mkRow(4, EX.dbRow, { reps: countReps(10), refId: "ps-1" }),
          mkRow(5, EX.dbCurl, { reps: countReps(10), refId: "ps-2" }),
          mkRow(6, EX.dbLateralRaise, { reps: countReps(10), refId: "ps-3" }),
        ],
        rowGroups: [
          composeRowGroup({
            refId: "per-set-group",
            notes: ["*DB exercise — set 1: DB row, set 2: DB curl, set 3: DB lateral raise"],
            memberRowRefIds: ["ps-slot", "ps-1", "ps-2", "ps-3"],
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_REP_DEFINITION_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-043",
  order: 4,
  labels: [LBL.gymnastics],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Rep Definition rounds",
        rows: [
          mkRow(1, EX.hsWalk, {
            reps: countReps(1),
            modifierRefs: [MOD.withoutJump],
            refId: "rd1-a",
          }),
          mkRow(2, EX.strictHspu, { reps: countReps(2), refId: "rd1-b" }),
          mkRow(3, EX.toesToBar, {
            reps: countReps(5),
            modifierRefs: [MOD.holdFarmerCarry],
            refId: "rd2-a",
          }),
          mkRow(4, EX.pullUp, { reps: countReps(5), refId: "rd2-b" }),
        ],
        rowGroups: [
          composeRowGroup({
            refId: "rep-def-1",
            notes: ["5 reps = 1 HS walk + 2 strict HSPU"],
            memberRowRefIds: ["rd1-a", "rd1-b"],
          }),
          composeRowGroup({
            refId: "rep-def-2",
            notes: ["{ 5 toes-to-bar + 5 pull-ups } = 1 rep"],
            memberRowRefIds: ["rd2-a", "rd2-b"],
          }),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};
