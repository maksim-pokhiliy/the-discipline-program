import { type CommandPaletteCommand } from "../command-palette.context";

export type BulkReplaceCommandDeps = {
  enabled: boolean;
  count: number;
  onTrigger: () => void;
};

export const createBulkReplaceCommand = (deps: BulkReplaceCommandDeps): CommandPaletteCommand => {
  const { enabled, count, onTrigger } = deps;

  return {
    id: "plan.bulk.replace",
    title: "Bulk replace selected entries",
    hint: enabled
      ? `Replace the exercise on ${count.toString()} selected entries.`
      : "Multi-select at least 2 entries first.",
    group: "Bulk",
    keywords: ["replace", "swap", "exchange", "bulk"],
    perform: () => {
      if (!enabled) {
        return;
      }

      onTrigger();
    },
  };
};
