import { type BulkPatchConflict } from "./training-plan-api.types";

export const pickConflictCurrentVersion = (
  conflicts: readonly BulkPatchConflict[] | undefined,
  fallback: number,
): number => {
  const first = conflicts?.[0];

  return first ? first.currentVersion : fallback;
};
