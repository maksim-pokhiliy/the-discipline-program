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

export const today = (): Date => {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
};

export const dateOnly = (date: Date): Date => {
  const d = new Date(date);

  d.setUTCHours(0, 0, 0, 0);

  return d;
};
