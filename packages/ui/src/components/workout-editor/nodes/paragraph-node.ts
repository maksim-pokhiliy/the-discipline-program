import { Node } from "@tiptap/core";

import { BLOCK_CONTENT_GROUP } from "../constants";

export const WorkoutParagraphNode = Node.create({
  name: "paragraph",
  group: BLOCK_CONTENT_GROUP,
  content: "inline*",
  parseHTML: () => [{ tag: "p" }],
  renderHTML: ({ HTMLAttributes }) => ["p", HTMLAttributes, 0],
});
