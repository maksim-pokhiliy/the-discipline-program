import { Node, type Attribute } from "@tiptap/core";

const zero: Attribute = { default: 0 };

export interface ExerciseLineAttrs {
  sortOrder: number;
}

export const ExerciseLineNode = Node.create({
  name: "exerciseLine",
  group: "exerciseLine",
  content: "(text | inlineMention)*",
  defining: true,
  isolating: false,
  selectable: false,
  draggable: false,
  addAttributes: () => ({
    sortOrder: zero,
  }),
  parseHTML: () => [{ tag: "p[data-exercise-line]" }],
  renderHTML: ({ HTMLAttributes }) => ["p", { ...HTMLAttributes, "data-exercise-line": "" }, 0],
});
