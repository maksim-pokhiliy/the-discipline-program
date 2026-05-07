import { type Exercise, MovementPattern, type PrismaClient, PrKind } from "@prisma/client";

type ExerciseSeed = {
  name: string;
  primaryMovement: MovementPattern;
  benchmarkPrKind: PrKind | null;
};

const EXERCISES: readonly ExerciseSeed[] = [
  {
    name: "Back Squat",
    primaryMovement: MovementPattern.SQUAT,
    benchmarkPrKind: PrKind.ONE_REP_MAX,
  },
  {
    name: "Front Squat",
    primaryMovement: MovementPattern.SQUAT,
    benchmarkPrKind: PrKind.ONE_REP_MAX,
  },
  { name: "Deadlift", primaryMovement: MovementPattern.HINGE, benchmarkPrKind: PrKind.ONE_REP_MAX },
  { name: "KB Swing", primaryMovement: MovementPattern.HINGE, benchmarkPrKind: null },
  {
    name: "Strict Pull-Up",
    primaryMovement: MovementPattern.PULL_VERTICAL,
    benchmarkPrKind: PrKind.MAX_REPS_UNBROKEN,
  },
  {
    name: "Toes-to-Bar",
    primaryMovement: MovementPattern.CORE_FLEXION,
    benchmarkPrKind: PrKind.MAX_REPS_UNBROKEN,
  },
  {
    name: "DB Bench Press",
    primaryMovement: MovementPattern.PUSH_HORIZONTAL,
    benchmarkPrKind: PrKind.N_REP_MAX,
  },
  {
    name: "Strict Press",
    primaryMovement: MovementPattern.PUSH_VERTICAL,
    benchmarkPrKind: PrKind.ONE_REP_MAX,
  },
  { name: "Wall Walk", primaryMovement: MovementPattern.GYMNASTIC_INVERTED, benchmarkPrKind: null },
  { name: "Box Jump", primaryMovement: MovementPattern.EXPLOSIVE, benchmarkPrKind: null },
  { name: "Run", primaryMovement: MovementPattern.CARDIO_RUN, benchmarkPrKind: null },
  { name: "Double-Under", primaryMovement: MovementPattern.CARDIO_OTHER, benchmarkPrKind: null },
] as const;

export const seedExercises = async (db: PrismaClient): Promise<Map<string, Exercise>> => {
  const map = new Map<string, Exercise>();

  for (const seed of EXERCISES) {
    const exercise = await db.exercise.create({
      data: {
        name: seed.name,
        primaryMovement: seed.primaryMovement,
        benchmarkPrKind: seed.benchmarkPrKind,
        urls: [],
      },
    });

    map.set(exercise.name, exercise);
  }

  console.log(`  Exercises: ${map.size}`);

  return map;
};
