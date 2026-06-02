import type { TimeCap } from "@repo/contracts/lms/_shared";

import { MOCK_EXERCISE_IDS } from "./compose-mock-exercises";
import { atomicExercise, compoundExercise, exerciseRow, restRow } from "./compose-mock-rows";
import type {
  ArrangementAxis,
  ComposeBlock,
  ComposeContainer,
  ComposeDay,
  ComposeNode,
  ComposeProgram,
  ComposeSession,
  ComposeWeek,
  RepetitionAxis,
  RestAxis,
  ScoringDirective,
} from "./compose-tree.types";
import { asNodeId } from "./lib/id-factory";

type ContainerInput = {
  header?: string;
  notes?: string;
  repetition?: RepetitionAxis;
  arrangement?: ArrangementAxis;
  scoring?: ScoringDirective;
  rest?: RestAxis;
  children: ComposeNode[];
};

const container = (idSeed: string, input: ContainerInput): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(idSeed),
  header: input.header ?? null,
  notes: input.notes ?? null,
  ...(input.repetition !== undefined && { repetition: input.repetition }),
  ...(input.arrangement !== undefined && { arrangement: input.arrangement }),
  ...(input.scoring !== undefined && { scoring: input.scoring }),
  ...(input.rest !== undefined && { rest: input.rest }),
  children: input.children,
});

const FIVE_MIN_CAP: TimeCap = { min: 5, unit: "min" };

const block = (idSeed: string, label: string, root: ComposeContainer): ComposeBlock => ({
  id: asNodeId(idSeed),
  label,
  root,
});

const buildBlockB = (): ComposeBlock =>
  block(
    "block-b",
    "EMOM 16 / 4 rounds",
    container("block-b-root", {
      header: "EMOM-16",
      repetition: { kind: "cadence", everyMin: 1, rounds: 4 },
      children: [
        container("block-b-min-1", { children: [] }),
        container("block-b-min-2", {
          children: [
            exerciseRow("block-b-min-2-row", {
              exercise: compoundExercise([
                { exerciseId: MOCK_EXERCISE_IDS.pullUp, reps: { kind: "count", value: 5 } },
                { exerciseId: MOCK_EXERCISE_IDS.dip, reps: { kind: "count", value: 10 } },
              ]),
            }),
          ],
        }),
        container("block-b-min-3", { children: [] }),
        container("block-b-min-4", {
          children: [restRow("block-b-min-4-row", 60, "active recovery")],
        }),
      ],
    }),
  );

const ladderTrack = (idSeed: string, steps: number[], exerciseId: string): ComposeContainer =>
  container(idSeed, {
    repetition: { kind: "ladder", steps },
    children: [exerciseRow(`${idSeed}-row`, { exercise: atomicExercise(exerciseId) })],
  });

const buildBlockC = (): ComposeBlock =>
  block(
    "block-c",
    "Parallel ladders into AMRAP",
    container("block-c-root", {
      header: "Fran-style couplet then bike",
      arrangement: { kind: "ordered" },
      children: [
        container("block-c-parallel", {
          arrangement: { kind: "parallel" },
          scoring: { kind: "for_time" },
          children: [
            ladderTrack("block-c-ladder-down", [21, 15, 9], MOCK_EXERCISE_IDS.thrusters),
            ladderTrack("block-c-ladder-up", [9, 15, 21], MOCK_EXERCISE_IDS.pullUp),
          ],
        }),
        container("block-c-amrap", {
          repetition: { kind: "timeCap", cap: FIVE_MIN_CAP },
          scoring: { kind: "amrap" },
          children: [
            exerciseRow("block-c-amrap-row", {
              exercise: atomicExercise(MOCK_EXERCISE_IDS.assaultBike),
              intensity: { effortPercent: { value: 90 } },
            }),
          ],
        }),
      ],
    }),
  );

const buildBlockD = (): ComposeBlock =>
  block(
    "block-d",
    "Intervals, max in remaining",
    container("block-d-root", {
      header: "3x (2min work / 1min off)",
      notes: "Score only rounds 2 and 3.",
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      scoring: { kind: "max_in_remaining" },
      children: [
        exerciseRow("block-d-kb", { exercise: atomicExercise(MOCK_EXERCISE_IDS.kettlebellSwing) }),
        exerciseRow("block-d-press", {
          exercise: atomicExercise(MOCK_EXERCISE_IDS.pushPress),
          side: { kind: "each_arm" },
        }),
        exerciseRow("block-d-wallball", { exercise: atomicExercise(MOCK_EXERCISE_IDS.wallBall) }),
      ],
    }),
  );

const buildGymnasticsBlock = (): ComposeBlock =>
  block(
    "week-gymnastics",
    "Strict gymnastics ladder",
    container("week-gymnastics-root", {
      header: "12-9-6 strict couplet",
      repetition: { kind: "ladder", steps: [12, 9, 6] },
      rest: { duration: { value: 5, unit: "min" }, scope: "between_rounds" },
      children: [
        exerciseRow("week-gym-pullup", { exercise: atomicExercise(MOCK_EXERCISE_IDS.pullUp) }),
        exerciseRow("week-gym-dip", { exercise: atomicExercise(MOCK_EXERCISE_IDS.dip) }),
      ],
    }),
  );

const buildStrengthBlock = (): ComposeBlock =>
  block(
    "week-strength",
    "Back squat wave",
    container("week-strength-root", {
      header: "5 sets, building",
      repetition: { kind: "count", count: 5 },
      children: [
        exerciseRow("week-strength-row", {
          exercise: atomicExercise(MOCK_EXERCISE_IDS.backSquat),
          reps: { kind: "count", value: 5 },
          load: { kind: "percentage", value: 80, reference: { scope: "self" } },
        }),
      ],
    }),
  );

const session = (idSeed: string, label: string, blocks: ComposeBlock[]): ComposeSession => ({
  id: asNodeId(idSeed),
  label,
  blocks,
});

const day = (idSeed: string, label: string, sessions: ComposeSession[]): ComposeDay => ({
  id: asNodeId(idSeed),
  label,
  sessions,
});

const buildGauntletWeek = (): ComposeWeek => ({
  id: asNodeId("week-gauntlet"),
  label: "Gauntlet showcase",
  days: [
    day("week-gauntlet-mon", "Monday", [
      session("week-gauntlet-mon-s1", "Conditioning", [
        buildBlockB(),
        buildBlockC(),
        buildBlockD(),
      ]),
    ]),
  ],
});

const buildPlannedWeek = (): ComposeWeek => ({
  id: asNodeId("week-planned"),
  label: "Week 1 — clone-and-tweak",
  days: [
    day("week-planned-wed", "Wednesday", [
      session("week-planned-wed-s1", "Gymnastics", [buildGymnasticsBlock(), buildStrengthBlock()]),
    ]),
  ],
});

export const MOCK_SEED: ComposeProgram = {
  weeks: [buildGauntletWeek(), buildPlannedWeek()],
};
