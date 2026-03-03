export const daysBetween = (a: Date, b: Date): number =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export const startOfToday = (): Date => {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
};

export const startOfWeek = (date: Date): Date => {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;

  d.setDate(d.getDate() - diff);

  return d;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d;
};
