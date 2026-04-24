import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";

import { SLASH_TRIGGER_CHAR } from "../constants";
import type { SlashCommandItem } from "../types";

export const SLASH_COMMAND_PLUGIN_KEY = new PluginKey("workoutEditorSlashCommand");

export type SlashSuggestionRenderer = {
  onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onExit: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export type SlashCommandOptions = {
  items: (props: { query: string; editor: Editor }) => SlashCommandItem[];
  render: () => SlashSuggestionRenderer;
};

const defaultOptions: SlashCommandOptions = {
  items: () => [],
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
      items: ({ query, editor }) => extensionOptions.items({ query, editor }),
      command: ({ editor, range, props }) => {
        runSlashCommand(editor, range, props);
      },
      render: extensionOptions.render,
    };

    return [Suggestion(suggestion)];
  },
});

const SCHEMELESS_BLOCK_NAMES = new Set<string>(["notes", "textCallout"]);

const buildBlockContent = (blockName: string): { type: string }[] => {
  if (blockName === "notes" || blockName === "textCallout") {
    return [{ type: "paragraph" }];
  }

  if (blockName === "emom") {
    return [{ type: "emomSlot" }];
  }

  return [];
};

export const runSlashCommand = (editor: Editor, range: Range, item: SlashCommandItem): void => {
  if (item.kind === "blockTemplate" || item.kind === "workoutTemplate") {
    const templateDoc = item.templateDoc;

    if (!templateDoc) {
      return;
    }

    editor.chain().focus().deleteRange(range).insertContent(templateDoc.content).run();

    return;
  }

  const blockName = item.blockNodeName;

  if (!blockName) {
    return;
  }

  const content = buildBlockContent(blockName);
  const attrs: Record<string, unknown> = SCHEMELESS_BLOCK_NAMES.has(blockName)
    ? {
        blockTypeId: item.blockTypeId ?? null,
        note: null,
        sortOrder: 0,
      }
    : {
        blockTypeId: item.blockTypeId ?? null,
        schemeId: item.schemeId ?? null,
        schemeKind: item.schemeKind ?? null,
        schemeConfig: item.schemeConfig ?? {},
        effortPct: null,
        pace: null,
        note: null,
        sortOrder: 0,
      };

  if (blockName === "textCallout") {
    attrs.tone = "info";
  }

  const insertPos = range.from;

  const chain = editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: blockName,
      attrs,
      content: content.length > 0 ? content : undefined,
    });

  chain.run();

  const endOfInserted = insertPos + 1;

  editor.chain().focus(endOfInserted).run();
};
