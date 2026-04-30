import { toast } from "sonner";

import { type CommandPaletteCommand } from "../command-palette.context";

export type DuplicateWeekCommandOptions = {
  planId: string;
  currentWeekIndex: number | null;
};

export const createDuplicateWeekCommand = (
  options: DuplicateWeekCommandOptions,
): CommandPaletteCommand => {
  const { planId, currentWeekIndex } = options;

  return {
    id: "plan.duplicate-week",
    title: "Duplicate current week",
    hint:
      currentWeekIndex !== null
        ? `Copy week ${(currentWeekIndex + 1).toString()} to a new week`
        : "Open a week first to duplicate it",
    group: "Plan",
    keywords: ["copy", "clone", "week"],
    perform: () => {
      void planId;

      if (currentWeekIndex === null) {
        toast.error("Open a week first to duplicate it");

        return;
      }

      toast.message("Duplicate week", {
        description: "Backend endpoint for week duplication lands in M2.",
      });
    },
  };
};
