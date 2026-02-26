export const daysBetween = (a: Date, b: Date): number =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export const startOfToday = (): Date => {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
};
