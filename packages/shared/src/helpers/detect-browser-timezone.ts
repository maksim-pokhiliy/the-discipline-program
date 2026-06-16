export const detectBrowserTimezone = (): string | null => {
  if (typeof Intl === "undefined") {
    return null;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return typeof tz === "string" && tz.length > 0 ? tz : null;
  } catch {
    return null;
  }
};
