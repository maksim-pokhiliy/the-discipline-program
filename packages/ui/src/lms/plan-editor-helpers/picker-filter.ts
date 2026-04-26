export type PickerListOption = {
  id: string;
  label: string;
};

const matchScore = (label: string, query: string): number => {
  if (query === "") {
    return 1;
  }

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerLabel.startsWith(lowerQuery)) {
    return 3;
  }

  if (lowerLabel.includes(lowerQuery)) {
    return 2;
  }

  return 0;
};

export const filterPickerOptions = <T extends PickerListOption>(
  options: readonly T[],
  query: string,
): T[] => {
  const trimmed = query.trim();

  if (trimmed === "") {
    return [...options];
  }

  return options
    .map((option) => ({ option, score: matchScore(option.label, trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.option);
};
