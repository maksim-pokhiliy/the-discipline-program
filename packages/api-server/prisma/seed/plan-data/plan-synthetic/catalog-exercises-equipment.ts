import type { ExerciseCatalogEntry } from "../canonical-schema";

import { atomic } from "./catalog-exercises-helpers";

const BARBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("back-squat", "Back Squat", "BARBELL", "SQUAT", "squat", {
    demo: "https://example.com/demo/back-squat",
  }),
  atomic("front-squat", "Front Squat", "BARBELL", "SQUAT", "squat"),
  atomic("overhead-squat", "Overhead Squat", "BARBELL", "SQUAT", "squat"),
  atomic("zercher-squat", "Zercher Squat", "BARBELL", "SQUAT", "squat"),
  atomic("pause-back-squat", "Pause Back Squat", "BARBELL", "SQUAT", "squat"),
  atomic("conventional-deadlift", "Conventional Deadlift", "BARBELL", "HINGE", "deadlift", {
    demo: "https://example.com/demo/deadlift",
  }),
  atomic("sumo-deadlift", "Sumo Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("romanian-deadlift", "Romanian Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("deficit-deadlift", "Deficit Deadlift", "BARBELL", "HINGE", "deadlift"),
  atomic("good-morning", "Good Morning", "BARBELL", "HINGE", "deadlift"),
  atomic("bench-press", "Bench Press", "BARBELL", "PRESS", "bench"),
  atomic("incline-bench-press", "Incline Bench Press", "BARBELL", "PRESS", "bench"),
  atomic("strict-press", "Strict Press", "BARBELL", "PRESS", "press"),
  atomic("push-press", "Push Press", "BARBELL", "PRESS", "press"),
  atomic("push-jerk", "Push Jerk", "BARBELL", "PRESS", "jerk"),
  atomic("split-jerk", "Split Jerk", "BARBELL", "PRESS", "jerk"),
  atomic("pendlay-row", "Pendlay Row", "BARBELL", "PULL", "row"),
  atomic("bent-over-row", "Bent Over Row", "BARBELL", "PULL", "row"),
  atomic("bb-snatch", "Barbell Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("power-snatch", "Power Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("hang-snatch", "Hang Snatch", "BARBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("bb-clean", "Barbell Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("power-clean", "Power Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("hang-clean", "Hang Clean", "BARBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("thruster", "Thruster", "BARBELL", "COMBINED_OLYMPIC", "thruster"),
  atomic("bb-walking-lunge", "Barbell Walking Lunge", "BARBELL", "LUNGE", "lunge"),
  atomic("bb-step-up", "Barbell Step Up", "BARBELL", "LUNGE", "lunge"),
  atomic("bb-curl", "Barbell Curl", "BARBELL", "RAISE", "biceps"),
  atomic("bb-reverse-curl", "Barbell Reverse Curl", "BARBELL", "RAISE", "biceps"),
];

const DUMBBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("db-bench-press", "DB Bench Press", "DUMBBELL", "PRESS", "bench"),
  atomic("db-incline-press", "DB Incline Press", "DUMBBELL", "PRESS", "bench"),
  atomic("db-shoulder-press", "DB Shoulder Press", "DUMBBELL", "PRESS", "press"),
  atomic("db-strict-press", "DB Strict Press", "DUMBBELL", "PRESS", "press"),
  atomic("db-push-press", "DB Push Press", "DUMBBELL", "PRESS", "press"),
  atomic("db-row", "DB Row", "DUMBBELL", "PULL", "row"),
  atomic("db-renegade-row", "DB Renegade Row", "DUMBBELL", "PULL", "row"),
  atomic("db-snatch", "DB Snatch", "DUMBBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("db-clean-and-jerk", "DB Clean and Jerk", "DUMBBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("db-thruster", "DB Thruster", "DUMBBELL", "COMBINED_OLYMPIC", "thruster"),
  atomic("db-walking-lunge", "DB Walking Lunge", "DUMBBELL", "LUNGE", "lunge"),
  atomic("db-bulgarian-split-squat", "DB Bulgarian Split Squat", "DUMBBELL", "LUNGE", "lunge"),
  atomic("db-step-up", "DB Step Up", "DUMBBELL", "LUNGE", "lunge"),
  atomic("db-goblet-squat", "DB Goblet Squat", "DUMBBELL", "SQUAT", "squat"),
  atomic("db-curl", "DB Curl", "DUMBBELL", "RAISE", "biceps"),
  atomic("db-hammer-curl", "DB Hammer Curl", "DUMBBELL", "RAISE", "biceps"),
  atomic("db-lateral-raise", "DB Lateral Raise", "DUMBBELL", "RAISE", "shoulder"),
  atomic("db-front-raise", "DB Front Raise", "DUMBBELL", "RAISE", "shoulder"),
  atomic("db-skull-crusher", "DB Skull Crusher", "DUMBBELL", "EXTENSION", "triceps"),
  atomic("db-deadlift", "DB Deadlift", "DUMBBELL", "HINGE", "deadlift"),
];

const KETTLEBELL_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("kb-swing", "KB Swing", "KETTLEBELL", "HINGE", "kb-swing"),
  atomic("kb-russian-swing", "KB Russian Swing", "KETTLEBELL", "HINGE", "kb-swing"),
  atomic("kb-snatch", "KB Snatch", "KETTLEBELL", "COMBINED_OLYMPIC", "snatch"),
  atomic("kb-clean", "KB Clean", "KETTLEBELL", "COMBINED_OLYMPIC", "clean"),
  atomic("kb-press", "KB Press", "KETTLEBELL", "PRESS", "press"),
  atomic("kb-row", "KB Row", "KETTLEBELL", "PULL", "row"),
  atomic("kb-goblet-squat", "KB Goblet Squat", "KETTLEBELL", "SQUAT", "squat"),
  atomic("kb-farmers-carry", "KB Farmers Carry", "KETTLEBELL", "CARRY", "carry"),
  atomic("kb-suitcase-carry", "KB Suitcase Carry", "KETTLEBELL", "CARRY", "carry"),
  atomic("kb-turkish-get-up", "KB Turkish Get Up", "KETTLEBELL", "COMBINED_OLYMPIC", "tgu"),
];

const ERG_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("row-erg", "Row Erg", "ROW_ERG", "CARDIO_FLOW", "row"),
  atomic("row-cal", "Row Erg (calories)", "ROW_ERG", "CARDIO_FLOW", "row"),
  atomic("ski-erg", "Ski Erg", "SKI_ERG", "CARDIO_FLOW", "ski"),
  atomic("ski-cal", "Ski Erg (calories)", "SKI_ERG", "CARDIO_FLOW", "ski"),
  atomic("bike-erg-cal", "Assault Bike (calories)", "ASSAULT_BIKE", "CARDIO_FLOW", "bike"),
  atomic("bike-erg-min", "Assault Bike Minutes", "ASSAULT_BIKE", "CARDIO_FLOW", "bike"),
];

const STRONGMAN_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("atlas-stone-to-shoulder", "Atlas Stone to Shoulder", "ATLAS_STONE", "HINGE", "stone"),
  atomic("atlas-stone-over", "Atlas Stone Over", "ATLAS_STONE", "HINGE", "stone"),
  atomic("yoke-carry", "Yoke Carry", "YOKE", "CARRY", "carry"),
  atomic("sled-push", "Sled Push", "SLED", "LOCOMOTION", "sled"),
  atomic("sled-drag", "Sled Drag", "SLED", "LOCOMOTION", "sled"),
  atomic("sled-pull", "Sled Pull", "SLED", "PULL", "sled"),
];

const BAND_AND_BOX_EXERCISES: ExerciseCatalogEntry[] = [
  atomic("band-pull-apart", "Band Pull Apart", "BAND", "PULL", "band"),
  atomic("band-row", "Band Row", "BAND", "PULL", "row"),
  atomic("band-pull-through", "Band Pull Through", "BAND", "HINGE", "band"),
  atomic("band-bicep-curl", "Band Bicep Curl", "BAND", "RAISE", "biceps"),
  atomic("band-tricep-pushdown", "Band Tricep Pushdown", "BAND", "EXTENSION", "triceps"),
  atomic("box-pistol", "Box Pistol Squat", "BOX", "SQUAT", "squat"),
  atomic("box-shrimp", "Box Shrimp Squat", "BOX", "SQUAT", "squat"),
  atomic("sofa-step-up", "Sofa Step Up", "SOFA", "LUNGE", "lunge"),
  atomic("sofa-hold", "Sofa Hold", "SOFA", "STATIC_HOLD", "core"),
];

export const EQUIPMENT_EXERCISES: ExerciseCatalogEntry[] = [
  ...BARBELL_EXERCISES,
  ...DUMBBELL_EXERCISES,
  ...KETTLEBELL_EXERCISES,
  ...ERG_EXERCISES,
  ...STRONGMAN_EXERCISES,
  ...BAND_AND_BOX_EXERCISES,
];
