import { z } from "zod";

import { dayOfWeekSchema } from "../../lms/_shared/day-of-week";

export const MOBILE_PUBLISH_ACTIONS = ["created", "updated", "skipped", "conflict"] as const;

export const MOBILE_PUBLISH_DAY_OF_WEEK_REQUIRED_MESSAGE =
  "dayOfWeek is required when scope is day";

export const publishDayResultSchema = z.object({
  scheduledDate: z.string(),
  action: z.enum(MOBILE_PUBLISH_ACTIONS),
  legacyRowId: z.number().int().nullable(),
});

export const publishMobileSchema = z
  .object({
    linkId: z.string().cuid(),
    startDate: z.string(),
    scope: z.enum(["day", "week"]),
    dayOfWeek: dayOfWeekSchema.optional(),
    overwriteUnowned: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "day" && data.dayOfWeek === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayOfWeek"],
        message: MOBILE_PUBLISH_DAY_OF_WEEK_REQUIRED_MESSAGE,
      });
    }
  });

export const publishMobileResultSchema = z.object({
  results: z.array(publishDayResultSchema),
});
