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

  it("returns false at the doc root with empty blocks", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [],
        },
        {
          type: "block",
          attrs: { blockTypeId: "bt-2", title: null, sortOrder: 1 },
          content: [],
        },
      ],
    });

    activeEditor = editor;

    const firstBlock = editor.state.doc.firstChild;

    expect(firstBlock).not.toBeNull();

    if (firstBlock === null) {
      return;
    }

    expect(canInsertExerciseMentionAt(editor, firstBlock.nodeSize)).toBe(false);
  });

  it("returns false directly inside a block (above any section)", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: null,
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [{ type: "exerciseLine", content: [] }],
            },
          ],
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 1)).toBe(false);
  });

  it("returns true inside an exerciseLine", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: null,
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [{ type: "exerciseLine", content: [] }],
            },
          ],
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 3)).toBe(true);
  });

  it("returns true inside an emomSlot (mention insertable from EMOM section line)", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: "EMOM",
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [
                { type: "emomSlot", attrs: { minuteInRound: 0, note: null, sortOrder: 0 } },
              ],
            },
          ],
        },
      ],
    });

    activeEditor = editor;

    expect(canInsertExerciseMentionAt(editor, 3)).toBe(true);
  });

  it("returns false at the boundary between two sections inside a block", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: null,
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [{ type: "exerciseLine", content: [] }],
            },
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: null,
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 1,
              },
              content: [{ type: "exerciseLine", content: [] }],
            },
          ],
        },
      ],
    });

    activeEditor = editor;

    const block = editor.state.doc.firstChild;

    expect(block).not.toBeNull();

    if (block === null) {
      return;
    }

    const firstSection = block.firstChild;

    expect(firstSection).not.toBeNull();

    if (firstSection === null) {
      return;
    }

    const between = 1 + firstSection.nodeSize;

    expect(canInsertExerciseMentionAt(editor, between)).toBe(false);
  });
});
