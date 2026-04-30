import { type CommandPaletteCommand } from "../command-palette.context";

export type BulkSuspendCommandDeps = {
  enabled: boolean;
  count: number;
  onTrigger: () => void;
};

export const createBulkSuspendCommand = (deps: BulkSuspendCommandDeps): CommandPaletteCommand => {
  const { enabled, count, onTrigger } = deps;

  return {
    id: "plan.bulk.suspend",
    title: "Bulk suspend selected blocks",
    hint: enabled
      ? `Suspend ${count.toString()} selected blocks (athletes see strikethrough).`
      : "Multi-select at least 2 blocks first.",
    group: "Bulk",
    keywords: ["suspend", "pause", "hide", "bulk"],
    perform: () => {
      if (!enabled) {
        return;
      }

      onTrigger();
    },
  };
};
