import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";

import { coreWorkoutExtensions } from "./registered-nodes";
import {
  handleBlockEnter,
  handleExerciseLineBackspace,
  handleExerciseLineEnter,
  handleSectionBackspace,
  handleSectionEnter,
} from "./runtime/keymap-handlers";

const buildEditor = (content: TiptapDoc) => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  return new Editor({ element, extensions: coreWorkoutExtensions, content });
};

const emptyLine: TiptapNode = { type: "exerciseLine", content: [] };

const emptySchemeSection = (sortOrder: number): TiptapNode => ({
  type: "schemeSection",
  attrs: {
    schemeId: null,
    schemeKind: null,
    schemeConfig: {},
    effortPct: null,
    pace: null,
    note: null,
    sortOrder,
  },
  content: [emptyLine],
});

const blockOf = (sections: ReadonlyArray<TiptapNode>, sortOrder = 0): TiptapNode => ({
  type: "block",
  attrs: { blockTypeId: "bt-1", title: null, sortOrder },
  content: [...sections],
});

const findFirstPos = (editor: Editor, name: string): number | null => {
  let pos: number | null = null;

  editor.state.doc.descendants((node, position) => {
    if (pos !== null) {
      return false;
    }

    if (node.type.name === name) {
      pos = position;

      return false;
    }

    return true;
  });

  return pos;
};

const placeCursorInside = (editor: Editor, name: string) => {
  const pos = findFirstPos(editor, name);

  expect(pos).not.toBeNull();

  if (pos !== null) {
    editor.commands.setTextSelection(pos + 1);
  }
};

const childTypes = (editor: Editor, parentName: string): string[] => {
  const result: string[] = [];

  editor.state.doc.descendants((node) => {
    if (node.type.name === parentName) {
      node.forEach((child) => {
        result.push(child.type.name);
      });

      return false;
    }

    return true;
  });

  return result;
};

const rootTypes = (editor: Editor): string[] => {
  const types: string[] = [];

  editor.state.doc.forEach((node) => {
    types.push(node.type.name);
  });

  return types;
};

let activeEditor: Editor | null = null;

afterEach(() => {
  activeEditor?.destroy();
  activeEditor = null;
});

describe("workout-editor keymap (D-KEYMAP)", () => {
  describe("Enter on exerciseLine", () => {
    it("returns false when the line has content", () => {
      const editor = buildEditor({
        type: "doc",
        content: [
          blockOf([
            {
              ...emptySchemeSection(0),
              content: [{ type: "exerciseLine", content: [{ type: "text", text: "hello" }] }],
            },
          ]),
        ],
      });

      activeEditor = editor;

      const linePos = findFirstPos(editor, "exerciseLine");

      expect(linePos).not.toBeNull();

      if (linePos === null) {
        return;
      }

      const lineNode = editor.state.doc.nodeAt(linePos);

      editor.commands.setTextSelection(linePos + 1 + (lineNode?.content.size ?? 0));

      expect(handleExerciseLineEnter(editor)).toBe(false);
    });

    it("appends a new sibling section when last line in non-last section", () => {
      const editor = buildEditor({
        type: "doc",
        content: [blockOf([emptySchemeSection(0), emptySchemeSection(1)])],
      });

      activeEditor = editor;

      placeCursorInside(editor, "exerciseLine");

      expect(handleExerciseLineEnter(editor)).toBe(true);
      expect(childTypes(editor, "block")).toEqual([
        "schemeSection",
        "schemeSection",
        "schemeSection",
      ]);
    });

    it("appends a new sibling block when last line in last section in last block", () => {
      const editor = buildEditor({
        type: "doc",
        content: [blockOf([emptySchemeSection(0)])],
      });

      activeEditor = editor;

      placeCursorInside(editor, "exerciseLine");

      expect(handleExerciseLineEnter(editor)).toBe(true);
      expect(rootTypes(editor)).toEqual(["block", "block"]);
    });
  });

  describe("Enter on empty section", () => {
    it("inserts a new sibling block when the section is empty", () => {
      const editor = buildEditor({
        type: "doc",
        content: [
          blockOf([
            {
              type: "notesSection",
              attrs: { note: null, sortOrder: 0 },
              content: [{ type: "paragraph" }],
            },
          ]),
        ],
      });

      activeEditor = editor;

      placeCursorInside(editor, "notesSection");
      handleSectionEnter(editor, "notesSection");

      expect(rootTypes(editor)[0]).toBe("block");
    });
  });

  describe("Enter on empty block", () => {
    it("appends a new sibling block at end of empty block", () => {
      const editor = buildEditor({
        type: "doc",
        content: [blockOf([])],
      });

      activeEditor = editor;

      placeCursorInside(editor, "block");

      expect(handleBlockEnter(editor)).toBe(true);
      expect(rootTypes(editor)).toEqual(["block", "block"]);
    });
  });

  describe("Backspace at start of empty exerciseLine", () => {
    it("deletes the parent section when the only line is empty", () => {
      const editor = buildEditor({
        type: "doc",
        content: [blockOf([emptySchemeSection(0), emptySchemeSection(1)])],
      });

      activeEditor = editor;

      placeCursorInside(editor, "exerciseLine");

      expect(handleExerciseLineBackspace(editor)).toBe(true);
      expect(childTypes(editor, "block")).toEqual(["schemeSection"]);
    });

    it("returns false when the line has content", () => {
      const editor = buildEditor({
        type: "doc",
        content: [
          blockOf([
            {
              ...emptySchemeSection(0),
              content: [{ type: "exerciseLine", content: [{ type: "text", text: "x" }] }],
            },
          ]),
        ],
      });

      activeEditor = editor;

      placeCursorInside(editor, "exerciseLine");

      expect(handleExerciseLineBackspace(editor)).toBe(false);
    });
  });

  describe("Backspace at start of empty schemeSection", () => {
    it("deletes the parent block when the only section is empty", () => {
      const editor = buildEditor({
        type: "doc",
        content: [
          blockOf([
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
              content: [],
            },
          ]),
        ],
      });

      activeEditor = editor;

      placeCursorInside(editor, "schemeSection");

      expect(handleSectionBackspace(editor, "schemeSection")).toBe(true);
      expect(rootTypes(editor)).toEqual([]);
    });
  });
});
