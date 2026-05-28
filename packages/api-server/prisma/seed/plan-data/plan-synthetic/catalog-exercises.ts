import type { ExerciseCatalogEntry } from "../canonical-schema";

import { BODYWEIGHT_AND_COMPOUND_EXERCISES } from "./catalog-exercises-bodyweight";
import { EQUIPMENT_EXERCISES } from "./catalog-exercises-equipment";

export const DEMO_EXERCISES: ExerciseCatalogEntry[] = [
  ...EQUIPMENT_EXERCISES,
  ...BODYWEIGHT_AND_COMPOUND_EXERCISES,
];
