import { type CommandPaletteCommand } from "../command-palette.context";

export type SaveAsTemplateCommandDeps = {
  enabled: boolean;
  scope: "block" | "session" | "week" | null;
  onTrigger: () => void;
};

export const createSaveAsTemplateCommand = (
  deps: SaveAsTemplateCommandDeps,
): CommandPaletteCommand => {
  const { enabled, scope, onTrigger } = deps;
  const scopeLabel = scope ? `${scope[0]?.toUpperCase() ?? ""}${scope.slice(1)}` : "";
  const title = enabled && scope ? `Save ${scope} as template` : "Save as template";

  return {
    id: "plan.save-as-template",
    title,
    hint: enabled
      ? `Capture the selected ${scopeLabel.toLowerCase()} as a reusable template (Cmd+Shift+S).`
      : "Select a block, session, or week first to save as template.",
    group: "Templates",
    keywords: ["save", "template", "snapshot"],
    perform: () => {
      if (!enabled) {
        return;
      }

      onTrigger();
    },
  };
};
