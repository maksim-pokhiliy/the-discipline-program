import { MIN_MENTION_QUERY_LENGTH_FOR_CREATE } from "../constants";
import type { ExerciseSuggestionItem } from "../extensions";
import type { SearchExercisesFn } from "../types";

export const buildMentionItems = async (
  query: string,
  searchExercises: SearchExercisesFn,
): Promise<ExerciseSuggestionItem[]> => {
  const trimmed = query.trim();
  const exercises = trimmed.length === 0 ? [] : await searchExercises(trimmed);

  const items: ExerciseSuggestionItem[] = exercises.map((exercise) => ({
    kind: "existing" as const,
    exercise,
  }));

  if (trimmed.length >= MIN_MENTION_QUERY_LENGTH_FOR_CREATE) {
    const lowered = trimmed.toLowerCase();
    const exact = exercises.find((ex) => ex.canonicalName.toLowerCase() === lowered);

    if (!exact) {
      items.push({ kind: "create", query: trimmed });
    }
  }

  return items;
};
