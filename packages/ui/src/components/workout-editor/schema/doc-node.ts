import { Node } from "@tiptap/core";

export const WorkoutDocNode = Node.create({
  name: "doc",
  topNode: true,
  content: "block*",
});
