import { toast } from "sonner";

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { type CommandPaletteCommand } from "../command-palette.context";

export type SearchPlanResult = {
  weekIndex: number;
  blockId: string;
  blockTitle: string;
};

export type SearchPlanCommandOptions = {
  data: GetPlanStructureResponse | undefined;
  onSelect: (result: SearchPlanResult) => void;
};

const promptForQuery = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.prompt("Search blocks across this plan");
};

export const findBlocksByQuery = (
  data: GetPlanStructureResponse | undefined,
  query: string,
): SearchPlanResult[] => {
  if (!data) {
    return [];
  }

  const trimmed = query.trim().toLowerCase();

  if (trimmed === "") {
    return [];
  }

  const out: SearchPlanResult[] = [];

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const title = block.title ?? "";
          const notes = block.notes ?? "";

          if (title.toLowerCase().includes(trimmed) || notes.toLowerCase().includes(trimmed)) {
            out.push({
              weekIndex: week.index,
              blockId: block.id,
              blockTitle: title || "(untitled block)",
            });
          }
        }
      }
    }
  }

  return out;
};

export const createSearchPlanCommand = (
  options: SearchPlanCommandOptions,
): CommandPaletteCommand => {
  const { data, onSelect } = options;

  return {
    id: "plan.search",
    title: "Search across plan",
    hint: "Find blocks by title or notes",
    group: "Navigation",
    keywords: ["find", "filter"],
    perform: () => {
      const query = promptForQuery();

      if (query === null || query.trim() === "") {
        return;
      }

      const results = findBlocksByQuery(data, query);

      if (results.length === 0) {
        toast.message("No blocks match your query", {
          description: `Searched ${(data?.plan.weeks.length ?? 0).toString()} weeks`,
        });

        return;
      }

      const first = results[0];

      if (!first) {
        return;
      }

      onSelect(first);

      if (results.length > 1) {
        toast.message(`Found ${results.length.toString()} matches`, {
          description: `Jumped to week ${(first.weekIndex + 1).toString()} — ${first.blockTitle}`,
        });
      }
    },
  };
};
