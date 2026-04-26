import { toast } from "sonner";

import { type CommandPaletteCommand } from "../command-palette.context";

export const createCreateWeekCommand = (planId: string): CommandPaletteCommand => ({
  id: "plan.create-week",
  title: "Create week",
  hint: "Append a new week to this plan",
  group: "Plan",
  keywords: ["new", "add", "week"],
  perform: () => {
    void planId;
    toast.message("Create week", {
      description: "Backend endpoint for week creation lands in M2.",
    });
  },
});
