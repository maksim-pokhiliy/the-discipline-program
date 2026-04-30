import { type CommandPaletteCommand } from "../command-palette.context";

export type BulkDeleteCommandDeps = {
  enabled: boolean;
  count: number;
  noun: string;
  onTrigger: () => void;
};

export const createBulkDeleteCommand = (deps: BulkDeleteCommandDeps): CommandPaletteCommand => {
  const { enabled, count, noun, onTrigger } = deps;

  return {
    id: "plan.bulk.delete",
    title: `Bulk delete selected ${noun}`,
    hint: enabled
      ? `Permanently delete ${count.toString()} selected ${noun}.`
      : "Multi-select at least 2 items first.",
    group: "Bulk",
    keywords: ["delete", "remove", "trash", "bulk"],
    perform: () => {
      if (!enabled) {
        return;
      }

      onTrigger();
    },
  };
};
