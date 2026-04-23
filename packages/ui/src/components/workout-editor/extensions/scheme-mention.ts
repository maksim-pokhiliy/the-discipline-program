import type { Editor, Range } from "@tiptap/core";

import type { SchemeSuggestion } from "../types";

export const insertSchemeMention = (
  editor: Editor,
  range: Range,
  scheme: SchemeSuggestion,
): void => {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: "schemeMention",
      attrs: {
        schemeId: scheme.id,
        schemeKind: scheme.kind,
        schemeConfig: scheme.paramDefaults,
        label: scheme.name,
      },
    })
    .run();
};

export const applySchemeToBlock = (editor: Editor, scheme: SchemeSuggestion): void => {
  editor
    .chain()
    .focus()
    .updateAttributes("straightSets", {
      schemeId: scheme.id,
      schemeKind: scheme.kind,
      schemeConfig: scheme.paramDefaults,
    })
    .run();
};
