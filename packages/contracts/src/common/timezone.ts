import { z } from "zod";

const isProbeNaN = (tz: string): boolean => {
  try {
    const probeUtc = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    const tzStr = probeUtc.toLocaleString("en-US", { timeZone: tz });

    return Number.isNaN(new Date(tzStr).getTime());
  } catch {
    return true;
  }
};

export const timezoneSchema = z.string().refine((tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });

    if (isProbeNaN(tz)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}, "must be a valid IANA timezone");
