import { Node, type Attribute } from "@tiptap/core";

const minuteAttr: Attribute = { default: 0 };
const noteAttr: Attribute = { default: null };
const sortAttr: Attribute = { default: 0 };

export const EmomSlotNode = Node.create({
  name: "emomSlot",
  group: "emomSlot",
  content: "exerciseMention*",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => ({
    minuteInRound: minuteAttr,
    note: noteAttr,
    sortOrder: sortAttr,
  }),
  parseHTML: () => [{ tag: "section[data-emom-slot]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", { ...HTMLAttributes, "data-emom-slot": "" }, 0],
});
