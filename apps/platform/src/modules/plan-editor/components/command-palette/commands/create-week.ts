import { type CommandPaletteCommand } from "../command-palette.context";

export type CreateWeekCommandOptions = {
  onTrigger: () => void;
};

export const createCreateWeekCommand = (
  options: CreateWeekCommandOptions,
): CommandPaletteCommand => ({
  id: "plan.create-week",
  title: "Create week",
  hint: "Append a new week to this plan",
  group: "Plan",
  keywords: ["new", "add", "week"],
  perform: () => {
    options.onTrigger();
  },
});
