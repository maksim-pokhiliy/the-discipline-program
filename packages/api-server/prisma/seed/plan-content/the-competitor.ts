import { type PrismaClient } from "@prisma/client";

import { dayOffset } from "../_helpers";
import { type SeededLibrary } from "../library";

import { type BlockSpec, buildDays, type DaySpec } from "./_builders";
import { standardWarmupBlock } from "./_fixtures";
import { currentWeekDays } from "./the-competitor-current-week";
import { futureDays } from "./the-competitor-future";
import { historyDays } from "./the-competitor-history";

const thuWeekTwoAmrapBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning"],
  schemeTypeName: "AMRAP",
  schemeParams: { kind: "COUNT_UP", cap: 720 },
  items: [
    {
      exerciseName: "Double-Under",
      prescription: {
        reps: { kind: "FIXED", value: 50 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "FIXED", value: 15 },
        load: { kind: "KB", kg: 24 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Wall Walk",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const thuWeekTwo = (): DaySpec => ({
  date: dayOffset(17),
  dayTypeName: null,
  sessions: [{ label: null, blocks: [standardWarmupBlock(), thuWeekTwoAmrapBlock()] }],
});

const buildSpec = (): readonly DaySpec[] => [
  ...historyDays(),
  ...currentWeekDays(),
  ...futureDays(),
  thuWeekTwo(),
];

export const seedTheCompetitorContent = async (
  db: PrismaClient,
  planId: string,
  library: SeededLibrary,
): Promise<void> => {
  await buildDays(db, planId, library, buildSpec());
};
