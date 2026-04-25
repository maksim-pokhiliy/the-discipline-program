import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { coreWorkoutExtensions } from "../registered-nodes";

import { resolveSlashContext } from "./resolve-slash-context";

const buildEditor = (content?: TiptapDoc) => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  return new Editor({
    element,
    extensions: coreWorkoutExtensions,
    content,
  });
};

let activeEditor: Editor | null = null;

afterEach(() => {
  activeEditor?.destroy();
  activeEditor = null;
});

describe("resolveSlashContext", () => {
  it("returns docRoot for cursor at position 0 of an empty doc", () => {
    const editor = buildEditor({ type: "doc", content: [] });

    activeEditor = editor;

    expect(resolveSlashContext(editor, { from: 0, to: 0 })).toBe("docRoot");
  });

  it("returns docRoot for a position at the boundary between two blocks", () => {
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

    const between = firstBlock.nodeSize;

    expect(resolveSlashContext(editor, { from: between, to: between })).toBe("docRoot");
  });

  it("returns insideBlock when cursor is inside a block", () => {
    const editor = buildEditor({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [],
        },
      ],
    });

    activeEditor = editor;

    expect(resolveSlashContext(editor, { from: 1, to: 1 })).toBe("insideBlock");
  });

  it("returns insideBlock when cursor is deep inside a section in a block", () => {
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

    const firstBlock = editor.state.doc.firstChild;

    expect(firstBlock).not.toBeNull();

    if (firstBlock === null) {
      return;
    }

    const inside = 1 + firstBlock.nodeSize - 2;

    expect(resolveSlashContext(editor, { from: inside, to: inside })).toBe("insideBlock");
  });
});
