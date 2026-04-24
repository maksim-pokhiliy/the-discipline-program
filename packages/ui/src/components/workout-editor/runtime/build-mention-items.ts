import type { ExerciseListItem } from "@repo/contracts/library/exercise";

import { MIN_MENTION_QUERY_LENGTH_FOR_CREATE } from "../constants";
import type { ExerciseSuggestionItem } from "../extensions";

export const buildMentionItems = (
  query: string,
  exercises: ReadonlyArray<ExerciseListItem>,
): ExerciseSuggestionItem[] => {
  const trimmed = query.trim();
  const lowered = trimmed.toLowerCase();

  const matched =
    trimmed.length === 0
      ? []
      : exercises.filter((ex) => {
          if (ex.canonicalName.toLowerCase().includes(lowered)) {
            return true;
          }

          return ex.aliases.some((alias) => alias.toLowerCase().includes(lowered));
        });

  const items: ExerciseSuggestionItem[] = matched.map((exercise) => ({
    kind: "existing" as const,
    exercise,
  }));

  if (trimmed.length >= MIN_MENTION_QUERY_LENGTH_FOR_CREATE) {
    const exact = matched.find((ex) => ex.canonicalName.toLowerCase() === lowered);

    if (!exact) {
      items.push({ kind: "create", query: trimmed });
    }
  }

  return items;
};
