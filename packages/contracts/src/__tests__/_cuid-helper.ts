export const cuid = (suffix: string): string => {
  const padded = suffix.padEnd(22, "0");

  return `clz${padded.slice(0, 22)}`;
};

export const CUID_PRIMARY = cuid("primaryxx");
export const CUID_SECONDARY = cuid("secondary");
export const CUID_TERTIARY = cuid("tertiary");
