const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_LENGTH = 10;

export const isValidIsoDate = (value: string): boolean => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, ISO_DATE_LENGTH) === value
  );
};

export const serializeLegacyDate = (value: Date | null): string | null =>
  value ? value.toISOString().slice(0, ISO_DATE_LENGTH) : null;

export const parseLegacyDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;
