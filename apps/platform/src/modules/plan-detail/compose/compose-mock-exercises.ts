import type {
  Exercise,
  ExerciseEquipment,
  ExerciseMovementType,
} from "@repo/contracts/lms/exercise";

import { exerciseCuid } from "./lib/seed-build";

const SEED_TIMESTAMP = new Date("2026-06-02T00:00:00.000Z");

type MockExerciseSeed = {
  canonicalName: string;
  primaryEquipment: ExerciseEquipment;
  movementTypeTagPrimary: ExerciseMovementType;
  movementFamily: string;
};

const buildExercise = (seed: MockExerciseSeed): Exercise => ({
  id: exerciseCuid(seed.canonicalName),
  canonicalName: seed.canonicalName,
  canonicalNameLower: seed.canonicalName.toLowerCase(),
  primaryEquipment: seed.primaryEquipment,
  movementTypeTagPrimary: seed.movementTypeTagPrimary,
  movementTypeTagSecondary: null,
  canonicalCompoundType: "ATOMIC",
  placeholderFlag: false,
  movementFamily: seed.movementFamily,
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
});

const MOCK_EXERCISE_SEEDS: MockExerciseSeed[] = [
  {
    canonicalName: "Thrusters",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "SQUAT",
    movementFamily: "thruster",
  },
  {
    canonicalName: "Pull-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PULL",
    movementFamily: "pull-up",
  },
  {
    canonicalName: "Dip",
    primaryEquipment: "PARALLEL_BARS",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "dip",
  },
  {
    canonicalName: "Kettlebell Swing",
    primaryEquipment: "KETTLEBELL",
    movementTypeTagPrimary: "HINGE",
    movementFamily: "swing",
  },
  {
    canonicalName: "Push Press",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "press",
  },
  {
    canonicalName: "Wall Ball",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "SQUAT",
    movementFamily: "wall-ball",
  },
  {
    canonicalName: "Assault Bike",
    primaryEquipment: "ASSAULT_BIKE",
    movementTypeTagPrimary: "CARDIO_FLOW",
    movementFamily: "bike",
  },
  {
    canonicalName: "Box Jump",
    primaryEquipment: "BOX",
    movementTypeTagPrimary: "LOCOMOTION",
    movementFamily: "box-jump",
  },
  {
    canonicalName: "Back Squat",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "SQUAT",
    movementFamily: "squat",
  },
  {
    canonicalName: "Plank",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "STATIC_HOLD",
    movementFamily: "core",
  },
];

export const MOCK_EXERCISES: Exercise[] = MOCK_EXERCISE_SEEDS.map(buildExercise);

export const MOCK_EXERCISE_IDS = {
  thrusters: exerciseCuid("Thrusters"),
  pullUp: exerciseCuid("Pull-up"),
  dip: exerciseCuid("Dip"),
  kettlebellSwing: exerciseCuid("Kettlebell Swing"),
  pushPress: exerciseCuid("Push Press"),
  wallBall: exerciseCuid("Wall Ball"),
  assaultBike: exerciseCuid("Assault Bike"),
  boxJump: exerciseCuid("Box Jump"),
  backSquat: exerciseCuid("Back Squat"),
  plank: exerciseCuid("Plank"),
} as const;
