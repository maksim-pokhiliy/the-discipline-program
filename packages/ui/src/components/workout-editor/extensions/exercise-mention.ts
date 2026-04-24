import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";

import { EXERCISE_MENTION_NODE_NAME, MENTION_TRIGGER_CHAR } from "../constants";
import type { ExerciseSuggestion } from "../types";

export const canInsertExerciseMentionAt = (editor: Editor, pos: number): boolean => {
  const mentionType = editor.schema.nodes[EXERCISE_MENTION_NODE_NAME];

  if (!mentionType) {
    return false;
  }

  let resolved: ReturnType<typeof editor.state.doc.resolve>;

  try {
    resolved = editor.state.doc.resolve(pos);
  } catch {
    return false;
  }

  for (let depth = resolved.depth; depth >= 0; depth -= 1) {
    const parentNode = resolved.node(depth);

    if (parentNode.type.contentMatch.matchType(mentionType)) {
      return true;
    }
  }

  return false;
};

export const EXERCISE_MENTION_PLUGIN_KEY = new PluginKey("workoutEditorExerciseMention");

export type ExerciseSuggestionItem =
  | { kind: "existing"; exercise: ExerciseSuggestion }
  | { kind: "create"; query: string };

export type ExerciseMentionRenderer = {
  onStart: (props: SuggestionProps<ExerciseSuggestionItem, ExerciseSuggestionItem>) => void;
  onUpdate: (props: SuggestionProps<ExerciseSuggestionItem, ExerciseSuggestionItem>) => void;
  onExit: (props: SuggestionProps<ExerciseSuggestionItem, ExerciseSuggestionItem>) => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export type ExerciseMentionOptions = {
  items: (props: { query: string; editor: Editor }) => ExerciseSuggestionItem[];
  onPickExisting: (exercise: ExerciseSuggestion, editor: Editor, range: Range) => void;
  onRequestCreate: (query: string, editor: Editor, range: Range) => void;
  render: () => ExerciseMentionRenderer;
};

const defaultOptions: ExerciseMentionOptions = {
  items: () => [],
  onPickExisting: () => undefined,
  onRequestCreate: () => undefined,
  render: () => ({
    onStart: () => undefined,
    onUpdate: () => undefined,
    onExit: () => undefined,
    onKeyDown: () => false,
  }),
};

type ExerciseSuggestionPluginOptions = SuggestionOptions<
  ExerciseSuggestionItem,
  ExerciseSuggestionItem
>;

export const ExerciseMentionExtension = Extension.create<ExerciseMentionOptions>({
  name: "workoutExerciseMention",

  addOptions() {
    return defaultOptions;
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    const suggestion: ExerciseSuggestionPluginOptions = {
      editor: this.editor,
      pluginKey: EXERCISE_MENTION_PLUGIN_KEY,
      char: MENTION_TRIGGER_CHAR,
      allowSpaces: true,
      allow: ({ editor, range }) => canInsertExerciseMentionAt(editor, range.from),
      items: ({ query, editor }) => extensionOptions.items({ query, editor }),
      command: ({ editor, range, props }) => {
        if (props.kind === "existing") {
          extensionOptions.onPickExisting(props.exercise, editor, range);

          return;
        }

        extensionOptions.onRequestCreate(props.query, editor, range);
      },
      render: extensionOptions.render,
    };

    return [Suggestion(suggestion)];
  },
});

export const insertExerciseMention = (
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
