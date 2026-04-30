import { toast } from "sonner";

import { type CommandPaletteCommand } from "../command-palette.context";

export type JumpToWeekCommandOptions = {
  maxIndex: number;
  jumpToWeek: (index: number) => void;
};

const promptForWeek = (maxIndex: number): number | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.prompt(`Jump to week (1–${(maxIndex + 1).toString()})`);

  if (raw === null) {
    return null;
  }

  const parsed = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed - 1;
};

export const createJumpToWeekCommand = (
  options: JumpToWeekCommandOptions,
): CommandPaletteCommand => {
  const { maxIndex, jumpToWeek } = options;

  return {
    id: "plan.jump-to-week",
    title: "Jump to week...",
    hint: `Available weeks: 1 to ${(maxIndex + 1).toString()}`,
    group: "Navigation",
    keywords: ["go", "navigate", "week"],
    perform: () => {
      const index = promptForWeek(maxIndex);

      if (index === null) {
        return;
      }

      if (index < 0 || index > maxIndex) {
        toast.error(`Week must be between 1 and ${(maxIndex + 1).toString()}`);

        return;
      }

      jumpToWeek(index);
    },
  };
};
