import { type Exercise } from "@repo/contracts/lms/exercise";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "./exercise-label-maps";

const FAMILY_PREFIX = " · family: ";
const META_SEPARATOR = " · ";

export const buildMetaLine = (exercise: Exercise): string => {
  const base = `${EQUIPMENT_LABELS[exercise.primaryEquipment]}${META_SEPARATOR}${MOVEMENT_TYPE_LABELS[exercise.movementTypeTagPrimary]}`;

  return exercise.movementFamily === null
    ? base
    : `${base}${FAMILY_PREFIX}${exercise.movementFamily}`;
};
