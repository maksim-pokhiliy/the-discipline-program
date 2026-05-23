export const monday = (yyyyMmDd: string): Date => new Date(`${yyyyMmDd}T00:00:00.000Z`);

export const requireId = <T extends { id: string }>(row: T): string => row.id;
