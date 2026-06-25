const MONTH_OFFSET = 1;
const PAD_LENGTH = 2;
const PAD_CHAR = "0";

export const toUtcDateParam = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + MONTH_OFFSET).padStart(PAD_LENGTH, PAD_CHAR);
  const day = String(date.getUTCDate()).padStart(PAD_LENGTH, PAD_CHAR);

  return `${year}-${month}-${day}`;
};
