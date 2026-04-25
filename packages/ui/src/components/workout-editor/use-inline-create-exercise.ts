"use client";

import { useCallback, useState } from "react";

import type { CreateExerciseFn, ExerciseSuggestion, InlineExerciseDraft } from "./types";

type InlineCreateState = {
  open: boolean;
  query: string;
  submitting: boolean;
  error?: string;
  resolve: ((result: ExerciseSuggestion | null) => void) | null;
};

const INITIAL_INLINE_CREATE: InlineCreateState = {
  open: false,
  query: "",
  submitting: false,
  error: undefined,
  resolve: null,
};

export type UseInlineCreateExerciseResult = {
  state: InlineCreateState;
  request: (query: string) => Promise<ExerciseSuggestion | null>;
  submit: (draft: InlineExerciseDraft) => Promise<void>;
  cancel: () => void;
};

export const useInlineCreateExercise = (
  createExercise: CreateExerciseFn,
): UseInlineCreateExerciseResult => {
  const [state, setState] = useState<InlineCreateState>(INITIAL_INLINE_CREATE);

  const request = useCallback(
    (query: string): Promise<ExerciseSuggestion | null> =>
      new Promise<ExerciseSuggestion | null>((resolve) => {
        setState({
          open: true,
          query,
          submitting: false,
          error: undefined,
          resolve,
        });
      }),
    [],
  );

  const submit = useCallback(
    async (draft: InlineExerciseDraft): Promise<void> => {
      setState((prev) => ({ ...prev, submitting: true, error: undefined }));

      try {
        const created = await createExercise({
          canonicalName: draft.canonicalName,
          aliases: [],
          measurementUnits: draft.measurementUnits,
          hasLoad: draft.hasLoad,
          description: draft.description,
          videoUrl: draft.videoUrl,
        });

        setState((prev) => {
          prev.resolve?.(created);

          return INITIAL_INLINE_CREATE;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create exercise";

        setState((prev) => ({ ...prev, submitting: false, error: message }));
      }
    },
    [createExercise],
  );

  const cancel = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(null);

      return INITIAL_INLINE_CREATE;
    });
  }, []);

  return { state, request, submit, cancel };
};
