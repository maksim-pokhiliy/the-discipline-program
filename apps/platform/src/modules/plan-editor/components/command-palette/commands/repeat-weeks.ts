import { type CommandPaletteCommand } from "../command-palette.context";

export type RepeatWeeksCommandDeps = {
  onTrigger: () => void;
};

export const createRepeatWeeksCommand = (deps: RepeatWeeksCommandDeps): CommandPaletteCommand => {
  const { onTrigger } = deps;

  return {
    id: "plan.bulk.repeat-weeks",
    title: "Repeat week pattern",
    hint: "Loop a source range of weeks into a destination range.",
    group: "Bulk",
    keywords: ["repeat", "loop", "weeks", "pattern", "bulk"],
    perform: () => {
      onTrigger();
    },
  };
};
