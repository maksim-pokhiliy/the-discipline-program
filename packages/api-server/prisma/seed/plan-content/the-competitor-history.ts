import { dayOffset } from "../_helpers";

import { type BlockSpec, type DaySpec } from "./_builders";
import { lightCooldownBlock, standardWarmupBlock } from "./_fixtures";

const monStrengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "NONE" },
  items: [
    {
      exerciseName: "Back Squat",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 100 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Press",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
        load: { kind: "BARBELL", kg: 50 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Deadlift",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 130 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const monAccessoryEmomBlock = (): BlockSpec => ({
  blockTypeNames: ["Accessory"],
  schemeTypeName: "EMOM",
  schemeParams: {
    kind: "EMOM_LOOP",
    totalMinutes: 12,
    slots: [
      { minutes: [0, 3, 6, 9], action: { kind: "ENTRY", entryRefIndex: 0 } },
      { minutes: [1, 4, 7, 10], action: { kind: "ENTRY", entryRefIndex: 1 } },
      { minutes: [2, 5, 8, 11], action: { kind: "REST" } },
    ],
  },
  items: [
    {
      exerciseName: "Strict Pull-Up",
      prescription: {
        reps: { kind: "FIXED", value: 6 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Toes-to-Bar",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
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

const monLastWeek = (): DaySpec => ({
  date: dayOffset(-7),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), monStrengthBlock(), monAccessoryEmomBlock()],
    },
  ],
});

const wedCompositeBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength Endurance", "Gymnastics"],
  schemeTypeName: "For Time",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 720 },
  items: [
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "FIXED", value: 30 },
        load: { kind: "KB", kg: 24 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Toes-to-Bar",
      prescription: {
        reps: { kind: "FIXED", value: 20 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Box Jump",
      prescription: {
        reps: { kind: "FIXED", value: 25 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const wedLastWeek = (): DaySpec => ({
  date: dayOffset(-5),
  dayTypeName: "Conditioning",
  sessions: [
    {
      label: "Afternoon",
      blocks: [standardWarmupBlock(), wedCompositeBlock(), lightCooldownBlock()],
    },
  ],
});

const thuRunBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning"],
  schemeTypeName: "Distance Run",
  schemeParams: { kind: "DISTANCE", unit: "KM", distanceMin: 5 },
  items: [
    {
      exerciseName: "Run",
      prescription: {
        distanceM: 5000,
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const thuLastWeek = (): DaySpec => ({
  date: dayOffset(-4),
  dayTypeName: "Active Recovery",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), thuRunBlock(), lightCooldownBlock()],
    },
  ],
});

const friStrengthBlock = (): BlockSpec => ({
  blockTypeNames: ["Strength"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "NONE" },
  items: [
    {
      exerciseName: "Deadlift",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        load: { kind: "BARBELL", kg: 140 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Front Squat",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        load: { kind: "BARBELL", kg: 80 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const friLadderBlock = (): BlockSpec => ({
  blockTypeNames: ["Conditioning"],
  schemeTypeName: "Rep Ladder",
  schemeParams: { kind: "LADDER", sequence: [21, 15, 9], direction: "DESC" },
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
        load: { kind: "KB", kg: 24 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

const friLastWeek = (): DaySpec => ({
  date: dayOffset(-3),
  dayTypeName: "Strength",
  sessions: [
    {
      label: "Morning",
      blocks: [standardWarmupBlock(), friStrengthBlock(), friLadderBlock()],
    },
  ],
});

const sunLastWeek = (): DaySpec => ({
  date: dayOffset(-1),
  dayTypeName: "Rest",
  sessions: [],
});

export const historyDays = (): readonly DaySpec[] => [
  monLastWeek(),
  wedLastWeek(),
  thuLastWeek(),
  friLastWeek(),
  sunLastWeek(),
];
