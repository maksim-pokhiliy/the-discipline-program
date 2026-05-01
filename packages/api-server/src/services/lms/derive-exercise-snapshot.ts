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

export const buildExerciseSnapshotMap = async (
  tx: TxClient,
  exerciseIds: string[],
): Promise<Map<string, ExerciseSnapshot>> => {
  if (exerciseIds.length === 0) {
    return new Map();
  }

  const uniqueIds = Array.from(new Set(exerciseIds));
  const exercises = await tx.exerciseLibraryItem.findMany({
    where: { id: { in: uniqueIds } },
  });

  const map = new Map<string, ExerciseSnapshot>();

  for (const exercise of exercises) {
    map.set(exercise.id, {
      id: exercise.id,
      name: exercise.name,
      primaryMovement: MOVEMENT_PATTERN_MAP[exercise.primaryMovement],
      modality: MODALITY_MAP[exercise.modality],
      primaryBodyParts: exercise.primaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
      defaultMetrics: exercise.defaultMetrics,
      demoVideoUrl: exercise.demoVideoUrl,
      demoImageUrl: exercise.demoImageUrl,
    });
  }

  return map;
};
