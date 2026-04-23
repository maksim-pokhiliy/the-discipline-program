import { type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { ExerciseStatus } from "@repo/contracts/library/exercise";

import { type LibraryLookup, type ParseWorkoutDocOptions } from "./parser-types";

export const BLOCK_TYPE_ID = "bt-strength";
export const SCHEME_ID_STRAIGHT = "scheme-straight";
export const SCHEME_ID_EMOM = "scheme-emom";
export const EXERCISE_ID_A = "ex-squat";
export const EXERCISE_ID_B = "ex-deadlift";
export const SAVING_COACH_ID = "coach-1";

export const buildLookup = (overrides?: Partial<LibraryLookup>): LibraryLookup => ({
  blockTypeIds: overrides?.blockTypeIds ?? new Set([BLOCK_TYPE_ID]),
  schemeIds: overrides?.schemeIds ?? new Set([SCHEME_ID_STRAIGHT, SCHEME_ID_EMOM]),
  exerciseIds: overrides?.exerciseIds ?? new Set([EXERCISE_ID_A, EXERCISE_ID_B]),
  exercisesById:
    overrides?.exercisesById ??
    new Map([
      [
        EXERCISE_ID_A,
        { id: EXERCISE_ID_A, status: ExerciseStatus.APPROVED, createdByUserId: "someone-else" },
      ],
      [
        EXERCISE_ID_B,
        { id: EXERCISE_ID_B, status: ExerciseStatus.APPROVED, createdByUserId: "someone-else" },
      ],
    ]),
});

export const parserOpts: ParseWorkoutDocOptions = { savingCoachUserId: SAVING_COACH_ID };

export const mentionNode = (
  exerciseId: string,
  attrs: Record<string, unknown> = {},
): TiptapNode => ({
  type: "exerciseMention",
  attrs: { exerciseId, ...attrs },
});

export const straightSetsBlock = (children: TiptapNode[] = []): TiptapNode => ({
  type: "straightSets",
  attrs: { blockTypeId: BLOCK_TYPE_ID, schemeId: SCHEME_ID_STRAIGHT, schemeConfig: {} },
  content: children,
});
