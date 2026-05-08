import { dayOffset } from "../_helpers";

import { type BlockSpec, type DaySpec } from "./_builders";
import { lightCooldownBlock, standardWarmupBlock } from "./_fixtures";

const monMorningStrengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 5 },
  items: [
    {
      exerciseName: "Front Squat",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 90 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Press",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 55 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monMorningCompositeBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength Endurance", "Gymnastics"],
  schemeTypeName: "For Time",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
  items: [
    {
      exerciseName: "Strict Pull-Up",
      prescription: {
        reps: { kind: "RANGE", min: 9, max: 21 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Box Jump",
      prescription: {
        reps: { kind: "RANGE", min: 9, max: 21 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "RANGE", min: 9, max: 21 },
        load: { kind: "KB", kg: 20 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monAfternoonAccessoryBlock = (): BlockSpec => ({
  blockTypeNames: ["Accessory"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 3 },
  items: [
    {
      exerciseName: "DB Bench Press",
      prescription: {
        reps: { kind: "FIXED", value: 12 },
        load: { kind: "DOUBLE_DB", kgEach: 22.5 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Pull-Up",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Toes-to-Bar",
      prescription: {
        reps: { kind: "FIXED", value: 10 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monThisWeek = (): DaySpec => ({
  date: dayOffset(0),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), monMorningStrengthBlock(), monMorningCompositeBlock()],
    },
    {
      label: "Afternoon",
      blocks: [monAfternoonAccessoryBlock(), lightCooldownBlock()],
    },
  ],
});

const wedEmomBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning"],
  schemeTypeName: "EMOM",
  schemeParams: {
    kind: "EMOM_LOOP",
    totalMinutes: 10,
    slots: [
      { minutes: [0, 2, 4, 6, 8], action: { kind: "ENTRY", entryRefIndex: 0 } },
      { minutes: [1, 3, 5, 7, 9], action: { kind: "ENTRY", entryRefIndex: 1 } },
    ],
  },
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
      exerciseName: "DB Bench Press",
      prescription: {
        reps: { kind: "FIXED", value: 10 },
        load: { kind: "DOUBLE_DB", kgEach: 22.5 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const wedThisWeek = (): DaySpec => ({
  date: dayOffset(2),
  dayTypeName: "Conditioning",
  sessions: [
    {
      label: "Evening",
      blocks: [standardWarmupBlock(), wedEmomBlock(), lightCooldownBlock()],
    },
  ],
});

const thuStrengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 5 },
  items: [
    {
      exerciseName: "Deadlift",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 145 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Back Squat",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 95 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const thuIntervalBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength Endurance"],
  schemeTypeName: "Interval Loop",
  schemeParams: {
    kind: "INTERVAL_LOOP",
    sets: 5,
    slots: [
      { durationSec: 30, action: "WORK" },
      { durationSec: 30, action: "REST" },
    ],
  },
  items: [
    {
      exerciseName: "Strict Pull-Up",
      prescription: {
        reps: { kind: "AMRAP_REPS" },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Toes-to-Bar",
      prescription: {
        reps: { kind: "AMRAP_REPS" },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const thuThisWeek = (): DaySpec => ({
  date: dayOffset(3),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), thuStrengthBlock(), thuIntervalBlock()],
    },
  ],
});

const satAmrapBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning"],
  schemeTypeName: "AMRAP",
  schemeParams: { kind: "COUNT_UP", cap: 1200 },
  items: [
    {
      exerciseName: "Box Jump",
      prescription: {
        reps: { kind: "FIXED", value: 15 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "FIXED", value: 20 },
        load: { kind: "KB", kg: 24 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Double-Under",
      prescription: {
        reps: { kind: "FIXED", value: 50 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const satThisWeek = (): DaySpec => ({
  date: dayOffset(5),
  dayTypeName: "Conditioning",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), satAmrapBlock(), lightCooldownBlock()],
    },
  ],
});

export const currentWeekDays = (): readonly DaySpec[] => [
  monThisWeek(),
  wedThisWeek(),
  thuThisWeek(),
  satThisWeek(),
];
