import { z } from "zod";

export const timezoneSchema = z.string().refine((tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });

    return true;
  } catch {
    return false;
  }
}, "must be a valid IANA timezone");
