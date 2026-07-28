import { type GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";
import { type OneRMRecordView } from "@repo/contracts/lms/records-view";

import { type OneRmMovementOption } from "../components/update-one-rm-form";

export const buildMovementOptions = (
  records: OneRMRecordView[],
  catalog: GetAthleteMovementsResponse,
): OneRmMovementOption[] => {
  const byExerciseId = new Map<string, OneRmMovementOption>();

  for (const record of records) {
    byExerciseId.set(record.exerciseId, {
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
    });
  }

  for (const movement of catalog) {
    if (byExerciseId.has(movement.id)) {
      continue;
    }

    byExerciseId.set(movement.id, {
      exerciseId: movement.id,
      exerciseName: movement.canonicalName,
    });
  }

  return [...byExerciseId.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
};
