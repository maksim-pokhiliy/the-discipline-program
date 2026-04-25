import type { Editor } from "@tiptap/core";
import type { ResolvedPos } from "@tiptap/pm/model";

const EXERCISE_LINE = "exerciseLine";
const SCHEME_SECTION = "schemeSection";
const NOTES_SECTION = "notesSection";
const TEXT_CALLOUT_SECTION = "textCalloutSection";
const BLOCK = "block";

const SECTION_NAMES = new Set<string>([SCHEME_SECTION, NOTES_SECTION, TEXT_CALLOUT_SECTION]);

const findAncestorDepth = ($pos: ResolvedPos, nodeName: string): number | null => {
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === nodeName) {
      return depth;
    }
  }

  return null;
};

const findSectionDepth = ($pos: ResolvedPos): number | null => {
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if (SECTION_NAMES.has($pos.node(depth).type.name)) {
      return depth;
    }
  }

  return null;
};

const isLastChildAt = ($pos: ResolvedPos, depth: number): boolean => {
  if (depth - 1 < 0) {
    return false;
  }

  const parent = $pos.node(depth - 1);
  const indexInParent = $pos.index(depth - 1);

  return indexInParent === parent.childCount - 1;
};

const isOnlyChildAt = ($pos: ResolvedPos, depth: number): boolean => {
  if (depth - 1 < 0) {
    return false;
  }

  return $pos.node(depth - 1).childCount === 1;
};

const buildEmptyExerciseLine = () => ({ type: EXERCISE_LINE, content: [] });

const buildEmptySchemeSection = () => ({
  type: SCHEME_SECTION,
  attrs: {
    schemeId: null,
    schemeKind: null,
    schemeConfig: {},
    effortPct: null,
    pace: null,
    note: null,
    sortOrder: 0,
  },
  content: [buildEmptyExerciseLine()],
});

const buildEmptyBlock = () => ({
  type: BLOCK,
  attrs: { blockTypeId: null, title: null, sortOrder: 0 },
  content: [buildEmptySchemeSection()],
});

const deleteAtPos = (editor: Editor, pos: number): boolean =>
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const target = tr.doc.nodeAt(pos);

      if (target === null) {
        return false;
      }

      tr.delete(pos, pos + target.nodeSize);

      return true;
    })
    .run();

export const handleExerciseLineEnter = (editor: Editor): boolean => {
  const { selection } = editor.state;

  if (!selection.empty) {
    return false;
  }

  const $from = selection.$from;
  const lineDepth = findAncestorDepth($from, EXERCISE_LINE);

  if (lineDepth === null) {
    return false;
  }

  const lineNode = $from.node(lineDepth);

  if (lineNode.content.size > 0) {
    return false;
  }

  const sectionDepth = findSectionDepth($from);

  if (sectionDepth === null || sectionDepth >= lineDepth) {
    return false;
  }

  const lineIsLastInSection = isLastChildAt($from, lineDepth);

  if (!lineIsLastInSection) {
    return false;
  }

  const blockDepth = findAncestorDepth($from, BLOCK);

  if (blockDepth === null) {
    return false;
  }

  const sectionIsLastInBlock = isLastChildAt($from, sectionDepth);

  if (sectionIsLastInBlock) {
    const blockEnd = $from.after(blockDepth);

    return editor.chain().focus().insertContentAt(blockEnd, buildEmptyBlock()).run();
  }

  const sectionEnd = $from.after(sectionDepth);

  return editor.chain().focus().insertContentAt(sectionEnd, buildEmptySchemeSection()).run();
};

export const handleExerciseLineBackspace = (editor: Editor): boolean => {
  const { selection } = editor.state;

  if (!selection.empty) {
    return false;
  }

  const $from = selection.$from;

  if ($from.parentOffset !== 0) {
    return false;
  }

  const lineDepth = findAncestorDepth($from, EXERCISE_LINE);

  if (lineDepth === null) {
    return false;
  }

  const lineNode = $from.node(lineDepth);

  if (lineNode.content.size > 0) {
    return false;
  }

  const sectionDepth = findSectionDepth($from);

  if (sectionDepth === null) {
    return false;
  }

  if (!isOnlyChildAt($from, lineDepth)) {
    return false;
  }

  return deleteAtPos(editor, $from.before(sectionDepth));
};

export const handleSectionEnter = (editor: Editor, sectionName: string): boolean => {
  const { selection } = editor.state;

  if (!selection.empty) {
    return false;
  }

  const $from = selection.$from;
  const sectionDepth = findAncestorDepth($from, sectionName);

  if (sectionDepth === null) {
    return false;
  }

  const sectionNode = $from.node(sectionDepth);

  if (sectionNode.content.size > 0) {
    return false;
  }

  const blockDepth = findAncestorDepth($from, BLOCK);

  if (blockDepth === null) {
    return false;
  }

  const blockEnd = $from.after(blockDepth);

  return editor.chain().focus().insertContentAt(blockEnd, buildEmptyBlock()).run();
};

export const handleSectionBackspace = (editor: Editor, sectionName: string): boolean => {
  const { selection } = editor.state;

  if (!selection.empty) {
    return false;
  }

  const $from = selection.$from;

  if ($from.parentOffset !== 0) {
    return false;
  }

  const sectionDepth = findAncestorDepth($from, sectionName);

  if (sectionDepth === null) {
    return false;
  }

  const sectionNode = $from.node(sectionDepth);

  if (sectionNode.content.size > 0) {
    return false;
  }

  if (!isOnlyChildAt($from, sectionDepth)) {
    return deleteAtPos(editor, $from.before(sectionDepth));
  }

  const blockDepth = findAncestorDepth($from, BLOCK);

  if (blockDepth === null) {
    return false;
  }

  return deleteAtPos(editor, $from.before(blockDepth));
};

export const handleBlockEnter = (editor: Editor): boolean => {
  const { selection } = editor.state;

  if (!selection.empty) {
    return false;
  }

  const $from = selection.$from;
  const blockDepth = findAncestorDepth($from, BLOCK);

  if (blockDepth === null) {
    return false;
  }

  const blockNode = $from.node(blockDepth);

  if (blockNode.content.size > 0) {
    return false;
  }

  const blockEnd = $from.after(blockDepth);

  return editor.chain().focus().insertContentAt(blockEnd, buildEmptyBlock()).run();
};
