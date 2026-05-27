export const requireId = <T extends { id: string }>(row: T): string => row.id;
