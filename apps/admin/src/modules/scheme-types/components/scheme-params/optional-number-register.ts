export const optionalNumberSetValueAs = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};
