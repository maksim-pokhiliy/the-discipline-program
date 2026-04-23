import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { coreWorkoutExtensions } from "../registered-nodes";

import { canInsertExerciseMentionAt } from "./exercise-mention";

const buildEditor = (content?: TiptapDoc) => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  const editor = new Editor({
    element,
    extensions: coreWorkoutExtensions,
    content,
  });

  return editor;
};

let activeEditor: Editor | null = null;

afterEach(() => {
  activeEditor?.destroy();
  activeEditor = null;
});

describe("canInsertExerciseMentionAt", () => {
  it("returns false at the doc root (no blocks yet)", () => {
    const editor = buildEditor();

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 0)).toBe(false);
  });

  it("returns false between two blocks (root level gap)", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: {
            blockTypeId: "bt-1",
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
        },
        {
          type: "straightSets",
          attrs: {
            blockTypeId: "bt-1",
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 1,
          },
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 2)).toBe(false);
  });

  it("returns true inside a straightSets block", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: {
            blockTypeId: "bt-1",
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 1)).toBe(true);
  });

  it("returns true inside an emomSlot", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "emom",
          attrs: {
            blockTypeId: "bt-1",
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
          content: [
            {
              type: "emomSlot",
              attrs: { minuteInRound: 0, note: null, sortOrder: 0 },
            },
          ],
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 2)).toBe(true);
  });

  it("returns false inside notes block (paragraph only accepts inline text, not mentions)", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "notes",
          attrs: { note: null, sortOrder: 0 },
          content: [{ type: "paragraph" }],
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 2)).toBe(false);
  });
});
