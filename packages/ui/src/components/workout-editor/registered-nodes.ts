import { ReactNodeViewRenderer } from "@tiptap/react";

import {
  AmrapNode,
  EmomNode,
  EmomSlotNode,
  EveryXMinNode,
  ExerciseMentionNode,
  ForTimeNode,
  IntervalsNode,
  NotesNode,
  PrescriptionChipNode,
  SchemeMentionNode,
  StraightSetsNode,
  TextCalloutNode,
  TimeBlocksNode,
} from "./nodes";
import { WorkoutParagraphNode } from "./nodes/paragraph-node";
import { WorkoutTextNode } from "./nodes/text-node";
import { WorkoutDocNode } from "./schema/doc-node";
import {
  BlockNodeView,
  EmomSlotView,
  ExerciseMentionView,
  NotesNodeView,
  PrescriptionChipView,
  SchemeMentionView,
  TextCalloutView,
} from "./views";

export const WorkoutStraightSetsNode = StraightSetsNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutForTimeNode = ForTimeNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutAmrapNode = AmrapNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutEmomNode = EmomNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutEmomSlotNode = EmomSlotNode.extend({
  addNodeView: () => ReactNodeViewRenderer(EmomSlotView),
});

export const WorkoutEveryXMinNode = EveryXMinNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutIntervalsNode = IntervalsNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutTimeBlocksNode = TimeBlocksNode.extend({
  addNodeView: () => ReactNodeViewRenderer(BlockNodeView),
});

export const WorkoutNotesNode = NotesNode.extend({
  addNodeView: () => ReactNodeViewRenderer(NotesNodeView),
});

export const WorkoutTextCalloutNode = TextCalloutNode.extend({
  addNodeView: () => ReactNodeViewRenderer(TextCalloutView),
});

export const WorkoutExerciseMentionNode = ExerciseMentionNode.extend({
  addNodeView: () => ReactNodeViewRenderer(ExerciseMentionView),
});

export const WorkoutSchemeMentionNode = SchemeMentionNode.extend({
  addNodeView: () => ReactNodeViewRenderer(SchemeMentionView),
});

export const WorkoutPrescriptionChipNode = PrescriptionChipNode.extend({
  addNodeView: () => ReactNodeViewRenderer(PrescriptionChipView),
});

export { WorkoutDocNode, WorkoutParagraphNode, WorkoutTextNode };

export const coreWorkoutExtensions = [
  WorkoutDocNode,
  WorkoutTextNode,
  WorkoutParagraphNode,
  WorkoutStraightSetsNode,
  WorkoutForTimeNode,
  WorkoutAmrapNode,
  WorkoutEmomNode,
  WorkoutEmomSlotNode,
  WorkoutEveryXMinNode,
  WorkoutIntervalsNode,
  WorkoutTimeBlocksNode,
  WorkoutNotesNode,
  WorkoutTextCalloutNode,
  WorkoutExerciseMentionNode,
  WorkoutSchemeMentionNode,
  WorkoutPrescriptionChipNode,
];
