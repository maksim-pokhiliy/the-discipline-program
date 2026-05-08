import { type PrismaClient } from "@prisma/client";

import { dayOffset } from "../_helpers";
import { type SeededLibrary } from "../library";

import { type BlockSpec, buildDays, type DaySpec } from "./_builders";

const warmupBlock = (): BlockSpec => ({
  blockTypeNames: ["Warm-Up"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 1 },
  items: [
    {
      exerciseName: "Box Jump",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "FIXED", value: 12 },
        load: { kind: "KB", kg: 16 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const strengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 5 },
  items: [
    {
      exerciseName: "Back Squat",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 60 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Press",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
        load: { kind: "BARBELL", kg: 30 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const buildSpec = (): readonly DaySpec[] => [
  {
    date: dayOffset(1),
    dayTypeName: "Strength",
    sessions: [
      {
        label: "Morning",
        blocks: [warmupBlock(), strengthBlock()],
      },
    ],
  },
];

export const seedFoundationsGppContent = async (
  db: PrismaClient,
  planId: string,
  library: SeededLibrary,
): Promise<void> => {
  await buildDays(db, planId, library, buildSpec());
};
