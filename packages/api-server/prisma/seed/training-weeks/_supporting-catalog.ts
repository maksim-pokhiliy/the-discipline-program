import {
  type AppLevel,
  type Equipment,
  type MovementType,
  type PrismaClient,
} from "@prisma/client";

import { requireId } from "./_id-helpers";

type ExerciseSeed = {
  canonicalName: string;
  primaryEquipment: Equipment;
  movementTypeTagPrimary: MovementType;
  movementFamily: string | null;
  defaultDemoUrls: readonly string[];
};

type LabelSeed = {
  name: string;
  applicableLevels: readonly AppLevel[];
};

const EXERCISE_SEEDS = {
  backSquat: {
    canonicalName: "Back Squat",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "SQUAT",
    movementFamily: "squat",
    defaultDemoUrls: ["https://example.com/demo/back-squat"],
  },
  bulgarianSplitSquat: {
    canonicalName: "Bulgarian Split Squat",
    primaryEquipment: "DUMBBELL",
    movementTypeTagPrimary: "LUNGE",
    movementFamily: "lunge",
    defaultDemoUrls: [],
  },
  pendlayRow: {
    canonicalName: "Pendlay Row",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "PULL",
    movementFamily: "row",
    defaultDemoUrls: [],
  },
  thruster: {
    canonicalName: "Thruster",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "COMBINED_OLYMPIC",
    movementFamily: "thruster",
    defaultDemoUrls: [],
  },
  pullUp: {
    canonicalName: "Pull-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PULL",
    movementFamily: "pull-up",
    defaultDemoUrls: ["https://example.com/demo/pull-up"],
  },
  deadlift: {
    canonicalName: "Deadlift",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "HINGE",
    movementFamily: "deadlift",
    defaultDemoUrls: ["https://example.com/demo/deadlift"],
  },
  rowCal: {
    canonicalName: "Row (calories)",
    primaryEquipment: "ROW_ERG",
    movementTypeTagPrimary: "CARDIO_FLOW",
    movementFamily: "row",
    defaultDemoUrls: [],
  },
  dbSnatch: {
    canonicalName: "DB Snatch",
    primaryEquipment: "DUMBBELL",
    movementTypeTagPrimary: "COMBINED_OLYMPIC",
    movementFamily: "snatch",
    defaultDemoUrls: [],
  },
  burpee: {
    canonicalName: "Burpee",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "LOCOMOTION",
    movementFamily: "burpee",
    defaultDemoUrls: [],
  },
  strictPress: {
    canonicalName: "Strict Press",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "overhead",
    defaultDemoUrls: ["https://example.com/demo/strict-press"],
  },
  c2b: {
    canonicalName: "Chest-to-bar Pull-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PULL",
    movementFamily: "pull-up",
    defaultDemoUrls: [],
  },
  hsWalk: {
    canonicalName: "Handstand Walk",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "LOCOMOTION",
    movementFamily: "handstand",
    defaultDemoUrls: [],
  },
  hspu: {
    canonicalName: "Handstand Push-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "handstand",
    defaultDemoUrls: [],
  },
  pushUp: {
    canonicalName: "Push-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "push-up",
    defaultDemoUrls: [],
  },
  airSquat: {
    canonicalName: "Air Squat",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "SQUAT",
    movementFamily: "squat",
    defaultDemoUrls: [],
  },
  run: {
    canonicalName: "Run",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "LOCOMOTION",
    movementFamily: "run",
    defaultDemoUrls: [],
  },
  snatch: {
    canonicalName: "Snatch",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "COMBINED_OLYMPIC",
    movementFamily: "snatch",
    defaultDemoUrls: [],
  },
  hangClean: {
    canonicalName: "Hang Clean",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "COMBINED_OLYMPIC",
    movementFamily: "clean",
    defaultDemoUrls: [],
  },
  pushJerk: {
    canonicalName: "Push Jerk",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "PRESS",
    movementFamily: "overhead",
    defaultDemoUrls: [],
  },
  t2b: {
    canonicalName: "Toes-to-bar",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "CORE",
    movementFamily: "core",
    defaultDemoUrls: [],
  },
  lSit: {
    canonicalName: "L-sit Hold",
    primaryEquipment: "PARALLEL_BARS",
    movementTypeTagPrimary: "STATIC_HOLD",
    movementFamily: "core",
    defaultDemoUrls: [],
  },
} as const satisfies Record<string, ExerciseSeed>;

const LABEL_SEEDS = {
  main: { name: "MAIN", applicableLevels: ["DAY", "SESSION"] },
  restDay: { name: "REST DAY", applicableLevels: ["DAY"] },
  strength: { name: "STRENGTH", applicableLevels: ["BLOCK"] },
  lower: { name: "LOWER", applicableLevels: ["BLOCK"] },
  metcon: { name: "METCON", applicableLevels: ["BLOCK"] },
  conditioning: { name: "CONDITIONING", applicableLevels: ["BLOCK"] },
  pump: { name: "PUMP SESSION", applicableLevels: ["BLOCK"] },
  gymnastics: { name: "GYMNASTICS", applicableLevels: ["BLOCK"] },
  skill: { name: "SKILL", applicableLevels: ["BLOCK"] },
  endurance: { name: "ENDURANCE", applicableLevels: ["BLOCK"] },
  partner: { name: "PARTNER", applicableLevels: ["BLOCK"] },
} as const satisfies Record<string, LabelSeed>;

type ExerciseKey = keyof typeof EXERCISE_SEEDS;
type LabelKey = keyof typeof LABEL_SEEDS;

export type SeedCatalogIds = {
  exerciseIds: Record<ExerciseKey, string>;
  labelIds: Record<LabelKey, string>;
};

export const seedSupportingCatalog = async (db: PrismaClient): Promise<SeedCatalogIds> => {
  const exerciseEntries = await Promise.all(
    (Object.entries(EXERCISE_SEEDS) as Array<[ExerciseKey, ExerciseSeed]>).map(
      async ([key, seed]) => {
        const row = await db.exercise.create({
          data: {
            canonicalName: seed.canonicalName,
            canonicalNameLower: seed.canonicalName.toLowerCase(),
            primaryEquipment: seed.primaryEquipment,
            movementTypeTagPrimary: seed.movementTypeTagPrimary,
            movementFamily: seed.movementFamily,
            defaultDemoUrls: [...seed.defaultDemoUrls],
            canonicalCompoundType: "ATOMIC",
            placeholderFlag: false,
          },
        });

        return [key, requireId(row)] as const;
      },
    ),
  );

  const labelEntries = await Promise.all(
    (Object.entries(LABEL_SEEDS) as Array<[LabelKey, LabelSeed]>).map(async ([key, seed]) => {
      const row = await db.label.create({
        data: {
          name: seed.name,
          nameLower: seed.name.toLowerCase(),
          applicableLevels: [...seed.applicableLevels],
        },
      });

      return [key, requireId(row)] as const;
    }),
  );

  const exerciseIds = Object.fromEntries(exerciseEntries) as Record<ExerciseKey, string>;
  const labelIds = Object.fromEntries(labelEntries) as Record<LabelKey, string>;

  console.log(
    `  Supporting catalog: ${exerciseEntries.length} exercises + ${labelEntries.length} labels`,
  );

  return { exerciseIds, labelIds };
};
