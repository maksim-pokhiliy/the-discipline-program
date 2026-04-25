import { Editor } from "@tiptap/core";
import { UndoRedo } from "@tiptap/extensions";
import { afterEach, describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { coreWorkoutExtensions } from "../registered-nodes";
import { synthesizeBlockId, synthesizeSectionId } from "../runtime/node-id-utils";

import { BlockDragHandleExtension } from "./block-drag-handle";

const buildEditor = (content: TiptapDoc) => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  return new Editor({
    element,
    extensions: [...coreWorkoutExtensions, UndoRedo, BlockDragHandleExtension],
    content,
  });
};

const blockDoc = (titles: ReadonlyArray<string>): TiptapDoc => ({
  type: "doc",
  content: titles.map((title, idx) => ({
    type: "block",
    attrs: { blockTypeId: `bt-${idx}`, title, sortOrder: idx },
    content: [],
  })),
});

const sectionDoc = (notes: ReadonlyArray<string>): TiptapDoc => ({
  type: "doc",
  content: [
    {
      type: "block",
      attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
      content: notes.map((note, idx) => ({
        type: "notesSection",
        attrs: { note, sortOrder: idx },
        content: [{ type: "paragraph" }],
      })),
    },
  ],
});

const collectBlockTitles = (editor: Editor): string[] => {
  const titles: string[] = [];

  editor.state.doc.forEach((block) => {
    const title = typeof block.attrs.title === "string" ? block.attrs.title : "";

    titles.push(title);
  });

  return titles;
};

const collectSectionNotes = (editor: Editor, blockIndex: number): string[] => {
  const notes: string[] = [];
  const block = editor.state.doc.maybeChild(blockIndex);

  if (block === null) {
    return notes;
  }

  block.forEach((section) => {
    const note = typeof section.attrs.note === "string" ? section.attrs.note : "";

    notes.push(note);
  });

  return notes;
};

let activeEditor: Editor | null = null;

afterEach(() => {
  activeEditor?.destroy();
  activeEditor = null;
});

describe("BlockDragHandleExtension", () => {
  describe("reorderBlocks", () => {
    it("rearranges root blocks per the supplied ordering", () => {
      const editor = buildEditor(blockDoc(["A", "B", "C"]));

      activeEditor = editor;

      const ok = editor.commands.reorderBlocks([
        synthesizeBlockId(2),
        synthesizeBlockId(0),
        synthesizeBlockId(1),
      ]);

      expect(ok).toBe(true);
      expect(collectBlockTitles(editor)).toEqual(["C", "A", "B"]);
    });

    it("rejects an ordering that omits or duplicates indices", () => {
      const editor = buildEditor(blockDoc(["A", "B", "C"]));

      activeEditor = editor;

      const okDup = editor.commands.reorderBlocks([
        synthesizeBlockId(0),
        synthesizeBlockId(0),
        synthesizeBlockId(2),
      ]);

      expect(okDup).toBe(false);
      expect(collectBlockTitles(editor)).toEqual(["A", "B", "C"]);

      const okShort = editor.commands.reorderBlocks([synthesizeBlockId(1), synthesizeBlockId(2)]);

      expect(okShort).toBe(false);
      expect(collectBlockTitles(editor)).toEqual(["A", "B", "C"]);
    });

    it("rejects ids that don't match the block:N format", () => {
      const editor = buildEditor(blockDoc(["A", "B"]));

      activeEditor = editor;

      const ok = editor.commands.reorderBlocks(["section:0:0", "block:1"]);

      expect(ok).toBe(false);
      expect(collectBlockTitles(editor)).toEqual(["A", "B"]);
    });

    it("can be undone with editor.commands.undo", () => {
      const editor = buildEditor(blockDoc(["A", "B", "C"]));

      activeEditor = editor;

      editor.commands.reorderBlocks([
        synthesizeBlockId(2),
        synthesizeBlockId(0),
        synthesizeBlockId(1),
      ]);

      expect(collectBlockTitles(editor)).toEqual(["C", "A", "B"]);

      editor.commands.undo();

      expect(collectBlockTitles(editor)).toEqual(["A", "B", "C"]);
    });
  });

  describe("reorderSections", () => {
    it("rearranges sections inside a single block", () => {
      const editor = buildEditor(sectionDoc(["one", "two", "three"]));

      activeEditor = editor;

      const ok = editor.commands.reorderSections(0, [
        synthesizeSectionId(0, 2),
        synthesizeSectionId(0, 0),
        synthesizeSectionId(0, 1),
      ]);

      expect(ok).toBe(true);
      expect(collectSectionNotes(editor, 0)).toEqual(["three", "one", "two"]);
    });

    it("rejects when blockPos points at a non-block node", () => {
      const editor = buildEditor(sectionDoc(["one", "two"]));

      activeEditor = editor;

      const ok = editor.commands.reorderSections(1, [
        synthesizeSectionId(0, 1),
        synthesizeSectionId(0, 0),
      ]);

      expect(ok).toBe(false);
      expect(collectSectionNotes(editor, 0)).toEqual(["one", "two"]);
    });

    it("can be undone with editor.commands.undo", () => {
      const editor = buildEditor(sectionDoc(["one", "two", "three"]));

      activeEditor = editor;

      editor.commands.reorderSections(0, [
        synthesizeSectionId(0, 2),
        synthesizeSectionId(0, 1),
        synthesizeSectionId(0, 0),
      ]);

      expect(collectSectionNotes(editor, 0)).toEqual(["three", "two", "one"]);

      editor.commands.undo();

      expect(collectSectionNotes(editor, 0)).toEqual(["one", "two", "three"]);
    });
  });
});
