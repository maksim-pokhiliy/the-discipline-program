import type { Editor, Range } from "@tiptap/core";

import type { CreateExerciseFn, ExerciseSuggestion, InlineExerciseDraft } from "../types";

import { insertExerciseMention } from "./exercise-mention";

export type InlineCreateExerciseContext = {
  createExercise: CreateExerciseFn;
  editor: Editor;
  range: Range;
  draft: InlineExerciseDraft;
};

export const createExerciseAndInsert = async (
  ctx: InlineCreateExerciseContext,
): Promise<ExerciseSuggestion> => {
  const created = await ctx.createExercise({
    canonicalName: ctx.draft.canonicalName,
    aliases: [],
    measurementUnits: ctx.draft.measurementUnits,
    hasLoad: ctx.draft.hasLoad,
    description: ctx.draft.description,
    videoUrl: ctx.draft.videoUrl,
  });

  insertExerciseMention(ctx.editor, ctx.range, created);

  return created;
};
