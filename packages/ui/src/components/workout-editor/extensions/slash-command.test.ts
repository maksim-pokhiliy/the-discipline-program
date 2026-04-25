import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { SchemeKind } from "@repo/contracts/library/scheme";

import { coreWorkoutExtensions } from "../registered-nodes";
import type { SlashCommandItem } from "../runtime/slash-items-types";

import { runSlashCommand } from "./slash-command";

type ChildLike = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ChildLike[];
};

const asChildren = (value: unknown): ChildLike[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as ChildLike[];
};

const childAt = (parent: ChildLike | undefined, index: number): ChildLike | undefined => {
  if (parent === undefined) {
    return undefined;
  }

  return asChildren(parent.content)[index];
};

const buildEditor = () => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  const editor = new Editor({
    element,
    extensions: coreWorkoutExtensions,
    content: undefined,
  });

  return { editor, element };
};

let activeEditor: Editor | null = null;

afterEach(() => {
  activeEditor?.destroy();
  activeEditor = null;
});

describe("runSlashCommand", () => {
  it("inserts a block from add-block item at doc root", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      kind: "add-block",
      id: "add-block-bt-1",
      blockTypeId: "bt-1",
      blockTypeSlug: "warm-up",
      label: "Warmup",
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const json = editor.getJSON();
    const root = asChildren(json.content);
    const block = root[0];

    expect(block?.type).toBe("block");
    expect(block?.attrs?.blockTypeId).toBe("bt-1");
    expect(asChildren(block?.content)).toHaveLength(0);
  });

  it("inserts a schemeSection inside a block when the cursor is in-block", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [],
      })
      .run();

    const blockEnd = editor.state.doc.content.size - 1;
    const item: SlashCommandItem = {
      kind: "add-scheme-section",
      id: "add-scheme-1",
      schemeId: "scheme-emom",
      schemeKind: SchemeKind.EMOM,
      schemeConfig: { interval: 60, rounds: 10 },
      label: "EMOM",
    };

    runSlashCommand(editor, { from: blockEnd, to: blockEnd }, item);

    const json = editor.getJSON();
    const root = asChildren(json.content);
    const block = root[0];

    expect(block?.type).toBe("block");

    const sections = asChildren(block?.content);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe("schemeSection");
    expect(sections[0]?.attrs?.schemeId).toBe("scheme-emom");
    expect(sections[0]?.attrs?.schemeKind).toBe(SchemeKind.EMOM);
    expect(sections[0]?.attrs?.schemeConfig).toEqual({ interval: 60, rounds: 10 });
  });

  it("inserts a notesSection with a paragraph child", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [],
      })
      .run();

    const blockEnd = editor.state.doc.content.size - 1;
    const item: SlashCommandItem = {
      kind: "add-notes-section",
      id: "add-notes",
      label: "Notes",
    };

    runSlashCommand(editor, { from: blockEnd, to: blockEnd }, item);

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];
    const section = childAt(block, 0);

    expect(section?.type).toBe("notesSection");

    const firstParagraph = childAt(section, 0);

    expect(firstParagraph?.type).toBe("paragraph");
  });

  it("inserts a textCalloutSection with tone=info default", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [],
      })
      .run();

    const blockEnd = editor.state.doc.content.size - 1;
    const item: SlashCommandItem = {
      kind: "add-text-callout-section",
      id: "add-text-callout",
      label: "Text callout",
    };

    runSlashCommand(editor, { from: blockEnd, to: blockEnd }, item);

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];
    const section = childAt(block, 0);

    expect(section?.type).toBe("textCalloutSection");
    expect(section?.attrs?.tone).toBe("info");
  });
});
