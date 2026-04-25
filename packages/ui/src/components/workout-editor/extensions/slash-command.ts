import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";

import { SLASH_TRIGGER_CHAR } from "../constants";
import { buildInsertShape } from "../runtime/build-insert-shape";
import { buildSlashItemsBlock } from "../runtime/build-slash-items-block";
import { buildSlashItemsDoc } from "../runtime/build-slash-items-doc";
import { resolveSlashContext } from "../runtime/resolve-slash-context";
import type { SlashCommandItem } from "../runtime/slash-items-types";

import { readBlockTypes } from "./block-types";
import { readSchemes } from "./schemes";

export const SLASH_COMMAND_PLUGIN_KEY = new PluginKey("workoutEditorSlashCommand");

export type SlashSuggestionRenderer = {
  onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onExit: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export type SlashCommandOptions = {
  items: (props: { query: string; editor: Editor; range: Range }) => SlashCommandItem[];
  render: () => SlashSuggestionRenderer;
};

const defaultOptions: SlashCommandOptions = {
  items: ({ query, editor, range }) => {
    const ctx = resolveSlashContext(editor, range);

    if (ctx === "docRoot") {
      return buildSlashItemsDoc(query, readBlockTypes(editor));
    }

    return buildSlashItemsBlock(query, readSchemes(editor));
  },
  render: () => ({
    onStart: () => undefined,
    onUpdate: () => undefined,
    onExit: () => undefined,
    onKeyDown: () => false,
  }),
};

export type SlashSuggestionOptions = SuggestionOptions<SlashCommandItem, SlashCommandItem>;

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "workoutSlashCommand",

  addOptions() {
    return defaultOptions;
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    const suggestion: SlashSuggestionOptions = {
      editor: this.editor,
      pluginKey: SLASH_COMMAND_PLUGIN_KEY,
      char: SLASH_TRIGGER_CHAR,
      startOfLine: false,
      allowSpaces: false,
      items: ({ query, editor }) => {
        const range = { from: editor.state.selection.from, to: editor.state.selection.to };

        return extensionOptions.items({ query, editor, range });
      },
      command: ({ editor, range, props }) => {
        runSlashCommand(editor, range, props);
      },
      render: extensionOptions.render,
    };

    return [Suggestion(suggestion)];
  },
});

export const runSlashCommand = (editor: Editor, range: Range, item: SlashCommandItem): void => {
  const shape = buildInsertShape(item);

  editor.chain().focus().deleteRange(range).insertContent(shape).run();
};
