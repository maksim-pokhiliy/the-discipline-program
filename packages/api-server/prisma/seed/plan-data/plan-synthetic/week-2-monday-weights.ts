import {
  absoluteLoad,
  buildComposeNode,
  compoundDeviceWeight,
  countReps,
  dualValueWeight,
  inlineEqualityCompoundRep,
  rangeReps,
  rounds,
  splitTierWeight,
  withAsymmetricArmWeight,
  withDepthModifierWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_WEIGHT_VARIANTS_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-119",
  order: 2,
  labels: [LBL.strength, LBL.accessory],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "weight variants showcase",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbRow } },
            {
              load: absoluteLoad(
                compoundDeviceWeight({ equipment: "DUMBBELL", count: 2, valueKg: 22.5 }),
              ),
              reps: countReps(10),
              position: "HAND_ON_DB",
            },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbRenegadeRow } },
            {
              load: absoluteLoad(
                splitTierWeight([
                  { reps: 5, equipment: "KETTLEBELL", valueKg: 24 },
                  { reps: 10, equipment: "DUMBBELL", valueKg: 15 },
                ]),
              ),
              reps: rangeReps(5, 15),
              position: "HANDS_ON_DB",
            },
          ),
          mkRow(
            3,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.overheadSquat } },
            {
              load: absoluteLoad(dualValueWeight({ first: 50, second: 30 })),
              reps: countReps(6),
              position: "HAND_ON_DB_NEUTRAL_GRIP",
            },
          ),
          mkRow(
            4,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbBenchPress } },
            {
              load: absoluteLoad(
                withAsymmetricArmWeight({
                  valueKg: 22.5,
                  workingArm: "left",
                  passiveArmAction: "hold_in_up",
                }),
              ),
              reps: countReps(8),
              position: "NEUTRAL_GRIP",
            },
          ),
          mkRow(
            5,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.kbSwing } },
            {
              load: absoluteLoad(withDepthModifierWeight({ valueKg: 24, depth: "to_parallel" })),
              reps: countReps(20),
              position: "WITHOUT_BENCH",
            },
          ),
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
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "placeholder body",
        rows: [
          mkRow(
            1,
            {
              rowKind: "PLACEHOLDER",
              placeholder: { placeholderKind: "muscle_group_reference", text: "biceps / triceps" },
            },
            { reps: countReps(12), position: "FROM_BOX" },
          ),
          mkRow(
            2,
            {
              rowKind: "PLACEHOLDER",
              placeholder: { placeholderKind: "purpose_category", text: "ABS" },
            },
            { reps: countReps(15), position: "FROM_BOX_OR_SOFA" },
          ),
          mkRow(
            3,
            {
              rowKind: "PLACEHOLDER",
              placeholder: {
                placeholderKind: "coach_choice_slot",
                text: "*DB exercise",
                perSetAssignments: {
                  placeholderName: "DB",
                  assignments: [
                    { setIndex: 1, exerciseId: EX.dbRow },
                    { setIndex: 2, exerciseId: EX.dbCurl },
                    { setIndex: 3, exerciseId: EX.dbLateralRaise },
                  ],
                },
              },
            },
            { reps: countReps(10), position: "FROM_SOFA_BOX" },
          ),
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
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Rep Definition rounds",
        rows: [
          mkRow(
            1,
            {
              rowKind: "REP_DEFINITION",
              equality: {
                form: "inline_equality",
                totalReps: 5,
                composition: [
                  { exerciseId: EX.hsWalk, count: 1 },
                  { exerciseId: EX.strictHspu, count: 2 },
                ],
              },
            },
            {
              compoundRep: inlineEqualityCompoundRep(5, [
                { exerciseId: EX.hsWalk, count: 1 },
                { exerciseId: EX.strictHspu, count: 2 },
              ]),
              position: "WITHOUT_JUMP",
            },
          ),
          mkRow(
            2,
            {
              rowKind: "REP_DEFINITION",
              equality: {
                form: "inline_equality",
                totalReps: 3,
                composition: [
                  { exerciseId: EX.toesToBar, count: 5 },
                  { exerciseId: EX.pullUp, count: 5 },
                ],
              },
            },
            {
              compoundRep: {
                form: "curly_brace",
                composition: [
                  { exerciseId: EX.toesToBar, count: 5 },
                  { exerciseId: EX.pullUp, count: 5 },
                ],
              },
              position: "HOLD_FARM_CARRY",
            },
          ),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};
