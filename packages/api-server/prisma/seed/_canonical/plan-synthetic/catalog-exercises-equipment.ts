import type { ExerciseCatalogEntry } from "../canonical-schema";

import { atomic } from "./catalog-exercises-helpers";

const BARBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("demo-back-squat", "Demo Back Squat", "BARBELL", "SQUAT", "squat", {
    demo: "https://example.com/demo/back-squat",
  }),
  atomic("demo-front-squat", "Demo Front Squat", "BARBELL", "SQUAT", "squat"),
  atomic("demo-overhead-squat", "Demo Overhead Squat", "BARBELL", "SQUAT", "squat"),
  atomic("demo-zercher-squat", "Demo Zercher Squat", "BARBELL", "SQUAT", "squat"),
  atomic("demo-pause-back-squat", "Demo Pause Back Squat", "BARBELL", "SQUAT", "squat"),
  atomic(
    "demo-conventional-deadlift",
    "Demo Conventional Deadlift",
    "BARBELL",
    "HINGE",
    "deadlift",
    { demo: "https://example.com/demo/deadlift" },
  ),
  atomic("demo-sumo-deadlift", "Demo Sumo Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("demo-romanian-deadlift", "Demo Romanian Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("demo-deficit-deadlift", "Demo Deficit Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("demo-good-morning", "Demo Good Morning", "BARBELL", "HINGE", "deadlift"),
  atomic("demo-bench-press", "Demo Bench Press", "BARBELL", "PRESS", "bench"),
  atomic("demo-incline-bench-press", "Demo Incline Bench Press", "BARBELL", "PRESS", "bench"),
  atomic("demo-strict-press", "Demo Strict Press", "BARBELL", "PRESS", "press"),
  atomic("demo-push-press", "Demo Push Press", "BARBELL", "PRESS", "press"),
  atomic("demo-push-jerk", "Demo Push Jerk", "BARBELL", "PRESS", "jerk"),
  atomic("demo-split-jerk", "Demo Split Jerk", "BARBELL", "PRESS", "jerk"),
  atomic("demo-pendlay-row", "Demo Pendlay Row", "BARBELL", "PULL", "row"),
  atomic("demo-bent-over-row", "Demo Bent Over Row", "BARBELL", "PULL", "row"),
  atomic("demo-bb-snatch", "Demo Barbell Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("demo-power-snatch", "Demo Power Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("demo-hang-snatch", "Demo Hang Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("demo-bb-clean", "Demo Barbell Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("demo-power-clean", "Demo Power Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("demo-hang-clean", "Demo Hang Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("demo-thruster", "Demo Thruster", "BARBELL", "COMBINED_OLYMPIC", "thruster"),
  atomic("demo-bb-walking-lunge", "Demo Barbell Walking Lunge", "BARBELL", "LUNGE", "lunge"),
  atomic("demo-bb-step-up", "Demo Barbell Step Up", "BARBELL", "LUNGE", "lunge"),
  atomic("demo-bb-curl", "Demo Barbell Curl", "BARBELL", "RAISE", "biceps"),
  atomic("demo-bb-reverse-curl", "Demo Barbell Reverse Curl", "BARBELL", "RAISE", "biceps"),
];

const DUMBBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("demo-db-bench-press", "Demo DB Bench Press", "DUMBBELL", "PRESS", "bench"),
  atomic("demo-db-incline-press", "Demo DB Incline Press", "DUMBBELL", "PRESS", "bench"),
  atomic("demo-db-shoulder-press", "Demo DB Shoulder Press", "DUMBBELL", "PRESS", "press"),
  atomic("demo-db-strict-press", "Demo DB Strict Press", "DUMBBELL", "PRESS", "press"),
  atomic("demo-db-push-press", "Demo DB Push Press", "DUMBBELL", "PRESS", "press"),
  atomic("demo-db-row", "Demo DB Row", "DUMBBELL", "PULL", "row"),
  atomic("demo-db-renegade-row", "Demo DB Renegade Row", "DUMBBELL", "PULL", "row"),
  atomic("demo-db-snatch", "Demo DB Snatch", "DUMBBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic(
    "demo-db-clean-and-jerk",
    "Demo DB Clean and Jerk",
    "DUMBBELL",
    "COMBINED_OLYMPIC",
    "clean",
  ),
  atomic("demo-db-thruster", "Demo DB Thruster", "DUMBBELL", "COMBINED_OLYMPIC", "thruster"),
  atomic("demo-db-walking-lunge", "Demo DB Walking Lunge", "DUMBBELL", "LUNGE", "lunge"),
  atomic(
    "demo-db-bulgarian-split-squat",
    "Demo DB Bulgarian Split Squat",
    "DUMBBELL",
    "LUNGE",
    "lunge",
  ),
  atomic("demo-db-step-up", "Demo DB Step Up", "DUMBBELL", "LUNGE", "lunge"),
  atomic("demo-db-goblet-squat", "Demo DB Goblet Squat", "DUMBBELL", "SQUAT", "squat"),
  atomic("demo-db-curl", "Demo DB Curl", "DUMBBELL", "RAISE", "biceps"),
  atomic("demo-db-hammer-curl", "Demo DB Hammer Curl", "DUMBBELL", "RAISE", "biceps"),
  atomic("demo-db-lateral-raise", "Demo DB Lateral Raise", "DUMBBELL", "RAISE", "shoulder"),
  atomic("demo-db-front-raise", "Demo DB Front Raise", "DUMBBELL", "RAISE", "shoulder"),
  atomic("demo-db-skull-crusher", "Demo DB Skull Crusher", "DUMBBELL", "EXTENSION", "triceps"),
  atomic("demo-db-deadlift", "Demo DB Deadlift", "DUMBBELL", "HINGE", "deadlift"),
];

const KETTLEBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("demo-kb-swing", "Demo KB Swing", "KETTLEBELL", "HINGE", "kb-swing"),
  atomic("demo-kb-russian-swing", "Demo KB Russian Swing", "KETTLEBELL", "HINGE", "kb-swing"),
  atomic("demo-kb-snatch", "Demo KB Snatch", "KETTLEBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("demo-kb-clean", "Demo KB Clean", "KETTLEBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("demo-kb-press", "Demo KB Press", "KETTLEBELL", "PRESS", "press"),
  atomic("demo-kb-row", "Demo KB Row", "KETTLEBELL", "PULL", "row"),
  atomic("demo-kb-goblet-squat", "Demo KB Goblet Squat", "KETTLEBELL", "SQUAT", "squat"),
  atomic("demo-kb-farmers-carry", "Demo KB Farmers Carry", "KETTLEBELL", "CARRY", "carry"),
  atomic("demo-kb-suitcase-carry", "Demo KB Suitcase Carry", "KETTLEBELL", "CARRY", "carry"),
  atomic(
    "demo-kb-turkish-get-up",
    "Demo KB Turkish Get Up",
    "KETTLEBELL",
    "COMBINED_OLYMPIC",
    "tgu",
  ),
];

const ERG_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("demo-row-erg", "Demo Row Erg", "ROW_ERG", "CARDIO_FLOW", "row"),
  atomic("demo-row-cal", "Demo Row Erg (calories)", "ROW_ERG", "CARDIO_FLOW", "row"),
  atomic("demo-ski-erg", "Demo Ski Erg", "SKI_ERG", "CARDIO_FLOW", "ski"),
  atomic("demo-ski-cal", "Demo Ski Erg (calories)", "SKI_ERG", "CARDIO_FLOW", "ski"),
  atomic(
    "demo-bike-erg-cal",
    "Demo Assault Bike (calories)",
    "ASSAULT_BIKE",
    "CARDIO_FLOW",
    "bike",
  ),
  atomic("demo-bike-erg-min", "Demo Assault Bike Minutes", "ASSAULT_BIKE", "CARDIO_FLOW", "bike"),
];

const STRONGMAN_EXERCISES: ExerciseCatalogEntry[] = [
  atomic(
    "demo-atlas-stone-to-shoulder",
    "Demo Atlas Stone to Shoulder",
    "ATLAS_STONE",
    "HINGE",
    "stone",
  ),
  atomic("demo-atlas-stone-over", "Demo Atlas Stone Over", "ATLAS_STONE", "HINGE", "stone"),
  atomic("demo-yoke-carry", "Demo Yoke Carry", "YOKE", "CARRY", "carry"),
  atomic("demo-sled-push", "Demo Sled Push", "SLED", "LOCOMOTION", "sled"),
  atomic("demo-sled-drag", "Demo Sled Drag", "SLED", "LOCOMOTION", "sled"),
  atomic("demo-sled-pull", "Demo Sled Pull", "SLED", "PULL", "sled"),
];

const BAND_AND_BOX_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("demo-band-pull-apart", "Demo Band Pull Apart", "BAND", "PULL", "band"),
  atomic("demo-band-row", "Demo Band Row", "BAND", "PULL", "row"),
  atomic("demo-band-pull-through", "Demo Band Pull Through", "BAND", "HINGE", "band"),
  atomic("demo-band-bicep-curl", "Demo Band Bicep Curl", "BAND", "RAISE", "biceps"),
  atomic("demo-band-tricep-pushdown", "Demo Band Tricep Pushdown", "BAND", "EXTENSION", "triceps"),
  atomic("demo-box-pistol", "Demo Box Pistol Squat", "BOX", "SQUAT", "squat"),
  atomic("demo-box-shrimp", "Demo Box Shrimp Squat", "BOX", "SQUAT", "squat"),
  atomic("demo-sofa-step-up", "Demo Sofa Step Up", "SOFA", "LUNGE", "lunge"),
  atomic("demo-sofa-hold", "Demo Sofa Hold", "SOFA", "STATIC_HOLD", "core"),
];

export const EQUIPMENT_EXERCISES: ExerciseCatalogEntry[] = [
  ...BARBELL_EXERCISES,
  ...DUMBBELL_EXERCISES,
  ...KETTLEBELL_EXERCISES,
  ...ERG_EXERCISES,
  ...STRONGMAN_EXERCISES,
  ...BAND_AND_BOX_EXERCISES,
];
