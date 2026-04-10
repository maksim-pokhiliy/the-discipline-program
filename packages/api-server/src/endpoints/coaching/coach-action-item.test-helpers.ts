export const daysAgo = (n: number): Date => {
  const d = new Date();

  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);

  return d;
};
