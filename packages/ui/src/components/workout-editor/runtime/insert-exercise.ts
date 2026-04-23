import type { Editor, Range } from "@tiptap/core";

import type { ExerciseSuggestion } from "../types";

export const runInsertExerciseMention = (
  editor: Editor,
  range: Range,
  exercise: ExerciseSuggestion,
): void => {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: "exerciseMention",
      attrs: {
        exerciseId: exercise.id,
        canonicalName: exercise.canonicalName,
        repScheme: null,
        repValues: [],
        sets: null,
        prescription: null,
        restSec: null,
        note: null,
        complexGroup: null,
        complexOrder: null,
        sortOrder: 0,
        emomSlotId: null,
      },
    })
    .run();
};
