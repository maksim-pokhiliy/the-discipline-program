export const validateCallbackUrl = (raw: string | null | undefined): string | null => {
  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  if (!raw.startsWith("/")) {
    return null;
  }

  if (raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }

  return raw;
};
