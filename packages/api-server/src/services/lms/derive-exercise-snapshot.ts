import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";

import { type TxClient } from "../../db/tx";
import { BODY_PART_MAP, MODALITY_MAP, MOVEMENT_PATTERN_MAP } from "../../mappers/lms";
import { findOrThrow } from "../../utils";

export const deriveExerciseSnapshot = async (
  tx: TxClient,
  exerciseId: string,
): Promise<ExerciseSnapshot> => {
  const exercise = await findOrThrow(
    tx.exerciseLibraryItem.findUnique({ where: { id: exerciseId } }),
    "Exercise library item",
  );

  return {
    id: exercise.id,
    name: exercise.name,
    primaryMovement: MOVEMENT_PATTERN_MAP[exercise.primaryMovement],
    modality: MODALITY_MAP[exercise.modality],
    primaryBodyParts: exercise.primaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
    defaultMetrics: exercise.defaultMetrics,
    demoVideoUrl: exercise.demoVideoUrl,
    demoImageUrl: exercise.demoImageUrl,
  };
};
