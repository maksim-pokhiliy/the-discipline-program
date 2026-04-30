export type CommandListEntry = {
  id: string;
  title: string;
  hint?: string;
  group?: string;
  keywords?: readonly string[];
};

const matchScore = (entry: CommandListEntry, query: string): number => {
  if (query === "") {
    return 1;
  }

  const haystack = [entry.title, entry.hint ?? "", ...(entry.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  const needle = query.toLowerCase();

  if (haystack.startsWith(needle)) {
    return 4;
  }

  if (haystack.includes(needle)) {
    return 2;
  }

  let cursor = 0;

  for (const ch of needle) {
    cursor = haystack.indexOf(ch, cursor);

    if (cursor === -1) {
      return 0;
    }

    cursor += 1;
  }

  return 1;
};

export const filterCommandList = <T extends CommandListEntry>(
  entries: readonly T[],
  query: string,
): T[] => {
  const trimmed = query.trim();

  if (trimmed === "") {
    return [...entries];
  }

  return entries
    .map((entry) => ({ entry, score: matchScore(entry, trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.entry);
};
