import { z } from "zod";

const IANA_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

export const timezoneSchema = z
  .string()
  .refine((tz) => IANA_TIMEZONES.has(tz), "must be a valid IANA timezone");
