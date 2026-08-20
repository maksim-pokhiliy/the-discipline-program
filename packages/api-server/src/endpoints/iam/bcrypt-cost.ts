const BCRYPT_COST_PATTERN = /^\$2[aby]\$(\d{2})\$/;

export const readBcryptCost = (hash: string): number | null => {
  const digits = BCRYPT_COST_PATTERN.exec(hash)?.[1];

  return digits === undefined ? null : Number(digits);
};
