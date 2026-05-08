import { dayOffset } from "../_helpers";

import { type BlockSpec, type DaySpec } from "./_builders";
import { lightCooldownBlock, standardWarmupBlock } from "./_fixtures";

const monNextTimeBoxedBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Time-Boxed",
  schemeParams: {
    kind: "TIME_BOXED",
    segments: [
      {
        startSec: 0,
        endSec: 600,
        label: "Build to heavy",
        innerArchetypeKind: "NONE",
        innerParams: { kind: "NONE" },
      },
      {
        startSec: 600,
        endSec: 1200,
        label: "Working sets",
        innerArchetypeKind: "NONE",
        innerParams: { kind: "NONE" },
      },
    ],
  },
  items: [
    {
      exerciseName: "Back Squat",
      prescription: {
        reps: { kind: "FIXED", value: 1 },
        load: { kind: "BARBELL", kg: 110 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Press",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 60 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monNextWeek = (): DaySpec => ({
  date: dayOffset(7),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), monNextTimeBoxedBlock(), lightCooldownBlock()],
    },
  ],
});

const thuNextCompositeBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning", "Gymnastics"],
  schemeTypeName: "For Time",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 900 },
  items: [
    {
      exerciseName: "Wall Walk",
      prescription: {
        reps: { kind: "FIXED", value: 10 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Run",
      prescription: {
        distanceM: 1000,
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Toes-to-Bar",
      prescription: {
        reps: { kind: "FIXED", value: 30 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const thuNextWeek = (): DaySpec => ({
  date: dayOffset(10),
  dayTypeName: "Conditioning",
  sessions: [
    {
      label: "Afternoon",
      blocks: [standardWarmupBlock(), thuNextCompositeBlock(), lightCooldownBlock()],
    },
  ],
});

const monWeekTwoStrengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 5 },
  items: [
    {
      exerciseName: "Front Squat",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 95 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "DB Bench Press",
      prescription: {
        reps: { kind: "FIXED", value: 10 },
        load: { kind: "DOUBLE_DB", kgEach: 25 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Deadlift",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 135 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monWeekTwo = (): DaySpec => ({
  date: dayOffset(14),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), monWeekTwoStrengthBlock()],
    },
  ],
});

export const futureDays = (): readonly DaySpec[] => [monNextWeek(), thuNextWeek(), monWeekTwo()];
