import { type BlockSpec } from "./_builders";

export const standardWarmupBlock = (): BlockSpec => ({
  blockTypeNames: ["Warm-Up"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 1 },
  items: [
    {
      exerciseName: "Double-Under",
      prescription: {
        reps: { kind: "FIXED", value: 30 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Box Jump",
      prescription: {
        reps: { kind: "FIXED", value: 8 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Wall Walk",
      prescription: {
        reps: { kind: "FIXED", value: 3 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});

export const lightCooldownBlock = (): BlockSpec => ({
  blockTypeNames: ["Cool-Down"],
  schemeTypeName: "Sets × Reps",
  schemeParams: { kind: "SETS_REPS", sets: 1 },
  items: [
    {
      exerciseName: "KB Swing",
      prescription: {
        reps: { kind: "FIXED", value: 10 },
        load: { kind: "KB", kg: 16 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
    {
      exerciseName: "Strict Pull-Up",
      prescription: {
        reps: { kind: "FIXED", value: 5 },
        sideMode: "BILATERAL",
        modifiers: [],
      },
    },
  ],
});
