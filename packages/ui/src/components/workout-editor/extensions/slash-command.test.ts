import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { coreWorkoutExtensions } from "../registered-nodes";
import type { SlashCommandItem } from "../types";

import { runSlashCommand } from "./slash-command";

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
  it("inserts an empty straightSets block on empty doc", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      id: "block-straightSets",
      kind: "straightSets",
      label: "Straight sets",
      blockNodeName: "straightSets",
      blockTypeId: "bt-1",
      schemeId: null,
      schemeKind: null,
      schemeConfig: {},
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const json = editor.getJSON();

    expect(json.type).toBe("doc");
    expect(json.content?.length).toBeGreaterThan(0);
    expect(json.content?.[0]?.type).toBe("straightSets");
    expect(json.content?.[0]?.attrs?.blockTypeId).toBe("bt-1");
    expect(json.content?.[0]?.content ?? []).toHaveLength(0);
  });

  it("places the cursor inside the new block after inserting", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      id: "block-straightSets",
      kind: "straightSets",
      label: "Straight sets",
      blockNodeName: "straightSets",
      blockTypeId: "bt-1",
      schemeId: null,
      schemeKind: null,
      schemeConfig: {},
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const { from } = editor.state.selection;
    const parent = editor.state.doc.resolve(from).parent;

    expect(parent.type.name).toBe("straightSets");
  });

  it("inserts emom with one default slot", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      id: "block-emom",
      kind: "emom",
      label: "EMOM",
      blockNodeName: "emom",
      blockTypeId: "bt-1",
      schemeId: null,
      schemeKind: null,
      schemeConfig: {},
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe("emom");
    const slots = json.content?.[0]?.content ?? [];

    expect(slots).toHaveLength(1);
    expect(slots[0]?.type).toBe("emomSlot");
  });

  it("does not insert any inline mention inside the new block (no Unknown exercise chip)", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      id: "block-straightSets",
      kind: "straightSets",
      label: "Straight sets",
      blockNodeName: "straightSets",
      blockTypeId: "bt-1",
      schemeId: null,
      schemeKind: null,
      schemeConfig: {},
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const json = editor.getJSON();
    const children = json.content?.[0]?.content ?? [];
    const mentions = children.filter((c) => c.type === "exerciseMention");

    expect(mentions).toHaveLength(0);
  });

  it("inserts textCallout with tone=info attribute", () => {
    const { editor } = buildEditor();

    activeEditor = editor;

    const item: SlashCommandItem = {
      id: "block-textCallout",
      kind: "textCallout",
      label: "Text callout",
      blockNodeName: "textCallout",
    };

    runSlashCommand(editor, { from: 0, to: 0 }, item);

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe("textCallout");
    expect(json.content?.[0]?.attrs?.tone).toBe("info");
  });
});
