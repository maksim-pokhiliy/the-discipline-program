import { type CommandPaletteCommand } from "../command-palette.context";

export type CloneDayCommandDeps = {
  onTrigger: () => void;
};

export const createCloneDayCommand = (deps: CloneDayCommandDeps): CommandPaletteCommand => {
  const { onTrigger } = deps;

  return {
    id: "plan.bulk.clone-day",
    title: "Clone day across week",
    hint: "Pick a source day and one or more targets to copy block shells.",
    group: "Bulk",
    keywords: ["clone", "duplicate", "copy", "day", "bulk"],
    perform: () => {
      onTrigger();
    },
  };
};
