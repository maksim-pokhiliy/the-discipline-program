import { z } from "zod";

import { WEEK_CONSTANTS } from "./week.constants";

export const weekSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  index: z.number().int().nonnegative(),
  label: z.string().max(WEEK_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  notes: z.string().max(WEEK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  version: z.number().int().min(1),
});
