import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { planEnrollmentSchema } from "../../lms/plan-enrollment";
import { healthStatusSchema } from "../athlete-profile";

export const planRosterUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: imageUrlSchema,
  healthStatus: healthStatusSchema,
});

export const planRosterEntrySchema = planEnrollmentSchema.extend({
  user: planRosterUserSchema,
});
