import { type CommandPaletteCommand } from "../command-palette.context";

export type SaveAsTemplateCommandDeps = {
  scope: "block" | "session" | "week" | null;
  onTrigger: () => void;
};

export const createSaveAsTemplateCommand = (
  deps: SaveAsTemplateCommandDeps,
): CommandPaletteCommand => {
  const { scope, onTrigger } = deps;
  const title = scope ? `Save ${scope} as template` : "Save as template";

  return {
    id: "plan.save-as-template",
    title,
    hint: scope
      ? `Capture the selected ${scope} as a reusable template (Cmd+Shift+S).`
      : "Capture the current selection (block / session / week) as a reusable template (Cmd+Shift+S).",
    group: "Templates",
    keywords: ["save", "template", "snapshot"],
    perform: () => {
      onTrigger();
    },
  };
};
