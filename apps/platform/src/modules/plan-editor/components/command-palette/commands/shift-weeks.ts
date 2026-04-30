import { type CommandPaletteCommand } from "../command-palette.context";

export type ShiftWeeksCommandDeps = {
  onTrigger: () => void;
};

export const createShiftWeeksCommand = (deps: ShiftWeeksCommandDeps): CommandPaletteCommand => {
  const { onTrigger } = deps;

  return {
    id: "plan.bulk.shift-weeks",
    title: "Shift weeks",
    hint: "Move blocks of a week range forward or backward by N weeks.",
    group: "Bulk",
    keywords: ["shift", "move", "weeks", "bulk"],
    perform: () => {
      onTrigger();
    },
  };
};
