"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Placeholder from "@tiptap/extension-placeholder";
import { UndoRedo } from "@tiptap/extensions";
import { useEditor as useTiptapEditor, type AnyExtension } from "@tiptap/react";

import { tiptapDocSchema, type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import type { BlockType } from "@repo/contracts/library/block-type";
import type { ExerciseListItem } from "@repo/contracts/library/exercise";
import type { Scheme } from "@repo/contracts/library/scheme";

import { WORKOUT_EDITOR_UPDATE_THROTTLE_MS } from "./constants";
import { ExerciseMentionExtension, SlashCommandExtension } from "./extensions";
import { BlockDragHandleExtension } from "./extensions/block-drag-handle";
import { BlockTypesExtension, writeBlockTypes } from "./extensions/block-types";
import { SchemesExtension, writeSchemes } from "./extensions/schemes";
import { coreWorkoutExtensions } from "./registered-nodes";
import {
  buildMentionItems,
  makeMentionHandlers,
  makeSlashHandlers,
  runInsertExerciseMention,
  type MentionRendererBundle,
  type SlashRendererBundle,
} from "./runtime";
import type { CreateExerciseFn, ExerciseSuggestion } from "./types";

type UseWorkoutEditorProps = {
  value: TiptapDoc | null;
  onChange: (doc: TiptapDoc | null) => void;
  onBlur?: () => void;
  exercises: ReadonlyArray<ExerciseListItem>;
  createExercise: CreateExerciseFn;
  blockTypes: ReadonlyArray<BlockType>;
  schemes: ReadonlyArray<Scheme>;
  placeholder: string;
  disabled: boolean;
  onRequestInlineCreate: (query: string) => Promise<ExerciseSuggestion | null>;
};

type OverlayState = {
  kind: "slash" | "mention";
} | null;

export const useWorkoutEditor = ({
  value,
  onChange,
  onBlur,
  exercises,
  createExercise,
  blockTypes,
  schemes,
  placeholder,
  disabled,
  onRequestInlineCreate,
}: UseWorkoutEditorProps) => {
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const pendingDocRef = useRef<TiptapDoc | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slashBundleRef = useRef<SlashRendererBundle | null>(null);
  const mentionBundleRef = useRef<MentionRendererBundle | null>(null);
  const exercisesRef = useRef(exercises);
  const inlineCreateRef = useRef(onRequestInlineCreate);
  const createExerciseRef = useRef(createExercise);
  const [overlay, setOverlay] = useState<OverlayState>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  useEffect(() => {
    inlineCreateRef.current = onRequestInlineCreate;
  }, [onRequestInlineCreate]);

  useEffect(() => {
    createExerciseRef.current = createExercise;
  }, [createExercise]);

  const flushPendingUpdate = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (pendingDocRef.current !== null) {
      const next = pendingDocRef.current;

      pendingDocRef.current = null;
      onChangeRef.current(next);
    }
  };

  const extensions = useMemo<AnyExtension[]>(() => {
    const slashHandlers = makeSlashHandlers(
      {
        get current() {
          return slashBundleRef.current;
        },
        set(bundle) {
          slashBundleRef.current = bundle;
        },
      },
      () => setOverlay(slashBundleRef.current ? { kind: "slash" } : null),
    );

    const mentionHandlers = makeMentionHandlers(
      {
        get current() {
          return mentionBundleRef.current;
        },
        set(bundle) {
          mentionBundleRef.current = bundle;
        },
      },
      () => setOverlay(mentionBundleRef.current ? { kind: "mention" } : null),
    );

    return [
      ...coreWorkoutExtensions,
      UndoRedo,
      Placeholder.configure({ placeholder }),
      BlockTypesExtension,
      SchemesExtension,
      BlockDragHandleExtension,
      SlashCommandExtension.configure({
        render: () => slashHandlers,
      }),
      ExerciseMentionExtension.configure({
        items: ({ query }) => buildMentionItems(query, exercisesRef.current),
        onPickExisting: (exercise, editor, range) => {
          runInsertExerciseMention(editor, range, exercise);
        },
        onRequestCreate: (query, editor, range) => {
          void (async () => {
            const created = await inlineCreateRef.current(query);

            if (!created) {
              return;
            }

            runInsertExerciseMention(editor, range, created);
          })();
        },
        render: () => mentionHandlers,
      }),
    ];
  }, [placeholder]);

  const editor = useTiptapEditor({
    immediatelyRender: false,
    extensions,
    content: value ?? undefined,
    editable: !disabled,
    onBlur: () => {
      flushPendingUpdate();
      onBlurRef.current?.();
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const json = updatedEditor.getJSON();
      const parsed = tiptapDocSchema.safeParse(json);

      pendingDocRef.current = parsed.success ? parsed.data : null;

      if (timerRef.current !== null) {
        return;
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const next = pendingDocRef.current;

        pendingDocRef.current = null;

        if (next !== null) {
          onChangeRef.current(next);
        }
      }, WORKOUT_EDITOR_UPDATE_THROTTLE_MS);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentDoc = tiptapDocSchema.safeParse(editor.getJSON());

    if (value === null) {
      if (!currentDoc.success || currentDoc.data.content.length > 0) {
        editor.commands.setContent({ type: "doc", content: [] }, { emitUpdate: false });
      }

      return;
    }

    if (!currentDoc.success || JSON.stringify(currentDoc.data) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    writeBlockTypes(editor, blockTypes);
    writeSchemes(editor, schemes);
    editor.view.dispatch(
      editor.state.tr.setMeta("libraryStateSync", true).setMeta("addToHistory", false),
    );
  }, [editor, blockTypes, schemes]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      slashBundleRef.current?.renderer.destroy();
      slashBundleRef.current = null;
      mentionBundleRef.current?.renderer.destroy();
      mentionBundleRef.current = null;
    },
    [],
  );

  return { editor, overlay };
};
