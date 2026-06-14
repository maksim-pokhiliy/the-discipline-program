export const daysAgo = (days: number): Date => {
  const d = new Date();

  d.setDate(d.getDate() - days);

  return d;
};

export const at = <T>(arr: T[], index: number): T => {
  const item = arr[index];

  if (item === undefined) {
    throw new Error(`Seed error: index ${index} out of bounds (length ${arr.length})`);
  }

  return item;
};
