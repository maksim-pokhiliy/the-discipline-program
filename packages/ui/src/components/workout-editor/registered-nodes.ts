import { ReactNodeViewRenderer } from "@tiptap/react";

import {
  BlockWrapperNode,
  EmomSlotNode,
  ExerciseLineNode,
  ExerciseMentionNode,
  NotesSectionNode,
  PrescriptionChipNode,
  SchemeSectionNode,
  TextCalloutSectionNode,
} from "./nodes";
import { WorkoutParagraphNode } from "./nodes/paragraph-node";
import { WorkoutTextNode } from "./nodes/text-node";
import {
  handleBlockEnter,
  handleExerciseLineBackspace,
  handleExerciseLineEnter,
  handleSectionBackspace,
  handleSectionEnter,
} from "./runtime/keymap-handlers";
import { WorkoutDocNode } from "./schema/doc-node";
import {
  BlockNodeView,
  EmomSlotView,
  ExerciseMentionView,
  NotesSectionView,
  PrescriptionChipView,
  SchemeSectionView,
  TextCalloutSectionView,
} from "./views";

const SCHEME_SECTION = "schemeSection";
const NOTES_SECTION = "notesSection";
const TEXT_CALLOUT_SECTION = "textCalloutSection";

export const WorkoutBlockWrapperNode = BlockWrapperNode.extend({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => handleBlockEnter(editor),
    };
  },
}).extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutSchemeSectionNode = SchemeSectionNode.extend({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => handleSectionEnter(editor, SCHEME_SECTION),
      Backspace: ({ editor }) => handleSectionBackspace(editor, SCHEME_SECTION),
    };
  },
}).extend({
  addNodeView: () => ReactNodeViewRenderer(SchemeSectionView),
});

export const WorkoutNotesSectionNode = NotesSectionNode.extend({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => handleSectionEnter(editor, NOTES_SECTION),
      Backspace: ({ editor }) => handleSectionBackspace(editor, NOTES_SECTION),
    };
  },
}).extend({
  addNodeView: () => ReactNodeViewRenderer(NotesSectionView),
});

export const WorkoutTextCalloutSectionNode = TextCalloutSectionNode.extend({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => handleSectionEnter(editor, TEXT_CALLOUT_SECTION),
      Backspace: ({ editor }) => handleSectionBackspace(editor, TEXT_CALLOUT_SECTION),
    };
  },
}).extend({
  addNodeView: () => ReactNodeViewRenderer(TextCalloutSectionView),
});

export const WorkoutExerciseLineNode = ExerciseLineNode.extend({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => handleExerciseLineEnter(editor),
      Backspace: ({ editor }) => handleExerciseLineBackspace(editor),
    };
  },
});

export const WorkoutEmomSlotNode = EmomSlotNode.extend({
  addNodeView: () => ReactNodeViewRenderer(EmomSlotView),
});

export const WorkoutExerciseMentionNode = ExerciseMentionNode.extend({
  addNodeView: () => ReactNodeViewRenderer(ExerciseMentionView),
});

export const WorkoutPrescriptionChipNode = PrescriptionChipNode.extend({
  addNodeView: () => ReactNodeViewRenderer(PrescriptionChipView),
});

export { WorkoutDocNode, WorkoutParagraphNode, WorkoutTextNode };

export const coreWorkoutExtensions = [
  WorkoutDocNode,
  WorkoutTextNode,
  WorkoutParagraphNode,
  WorkoutBlockWrapperNode,
  WorkoutSchemeSectionNode,
  WorkoutNotesSectionNode,
  WorkoutTextCalloutSectionNode,
  WorkoutExerciseLineNode,
  WorkoutEmomSlotNode,
  WorkoutExerciseMentionNode,
  WorkoutPrescriptionChipNode,
];
