import { type CompoundRowElement, type ExerciseForm } from "@repo/contracts/lms/_shared";

import { type ExerciseById } from "./format-percentage-reference";
import { formatRepNotation } from "./format-rep-notation";

const UNKNOWN_EXERCISE_FALLBACK = "—";
const PLACEHOLDER_NAME_FALLBACK = "(placeholder)";
const COMPOUND_REP_SEPARATOR = " × ";
const COMPOUND_JOIN = " + ";
const OR_ALTERNATIVE_INFIX = " · or · ";
const COMPOUND_SUB_LABEL = "compound row";
const PLACEHOLDER_SUB_LABEL = "placeholder";
const PURPOSE_UNDERSCORE_RE = /_/g;
const PURPOSE_REPLACEMENT = " ";

export type FormatExerciseFormResult = {
  name: string;
  sub: string[];
};

const lookupName = (exerciseId: string, exerciseById: ExerciseById, fallback: string): string =>
  exerciseById.get(exerciseId)?.canonicalName ?? fallback;

const formatCompoundElement = (element: CompoundRowElement, exerciseById: ExerciseById): string => {
  const name = lookupName(element.exerciseId, exerciseById, UNKNOWN_EXERCISE_FALLBACK);

  return `${name}${COMPOUND_REP_SEPARATOR}${formatRepNotation(element.reps)}`;
};

export const formatExerciseForm = (
  form: ExerciseForm,
  exerciseById: ExerciseById,
): FormatExerciseFormResult => {
  switch (form.form) {
    case "atomic": {
      const exercise = exerciseById.get(form.exerciseId);

      if (exercise?.placeholderFlag === true) {
        return {
          name: exercise.canonicalName ?? PLACEHOLDER_NAME_FALLBACK,
          sub: [PLACEHOLDER_SUB_LABEL],
        };
      }

      return {
        name: lookupName(form.exerciseId, exerciseById, UNKNOWN_EXERCISE_FALLBACK),
        sub: [],
      };
    }
    case "compound": {
      const name = form.compound.elements
        .map((element) => formatCompoundElement(element, exerciseById))
        .join(COMPOUND_JOIN);

      return { name, sub: [COMPOUND_SUB_LABEL] };
    }
    case "or_alternative": {
      const primary = lookupName(
        form.orAlternative.primaryExerciseId,
        exerciseById,
        UNKNOWN_EXERCISE_FALLBACK,
      );
      const alternative = lookupName(
        form.orAlternative.alternativeExerciseId,
        exerciseById,
        UNKNOWN_EXERCISE_FALLBACK,
      );
      const purposeText = form.orAlternative.purpose.replace(
        PURPOSE_UNDERSCORE_RE,
        PURPOSE_REPLACEMENT,
      );
      const sub = purposeText.length > 0 ? [purposeText] : [];

      return {
        name: `${primary}${OR_ALTERNATIVE_INFIX}${alternative}`,
        sub,
      };
    }
    case "placeholder_ref":
      return {
        name: lookupName(form.placeholderExerciseId, exerciseById, PLACEHOLDER_NAME_FALLBACK),
        sub: [PLACEHOLDER_SUB_LABEL],
      };
    default:
      form satisfies never;

      return { name: UNKNOWN_EXERCISE_FALLBACK, sub: [] };
  }
};
