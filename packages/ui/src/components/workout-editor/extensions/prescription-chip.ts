import type { Editor, Range } from "@tiptap/core";

import type { PrescriptionChipAttrs } from "../types";

export const insertPrescriptionChip = (
  editor: Editor,
  range: Range,
  attrs: PrescriptionChipAttrs,
): void => {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: "prescriptionChip",
      attrs,
    })
    .run();
};
