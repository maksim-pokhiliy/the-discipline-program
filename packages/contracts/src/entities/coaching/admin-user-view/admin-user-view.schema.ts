import { z } from "zod";

import { coachListItemSchema, userSchema } from "../../iam/user";
import { athleteProfileSchema } from "../athlete-profile";
import { coachProfileSchema } from "../coach-profile";

export const adminUserViewSchema = userSchema.extend({
  hasPassword: z.boolean(),
  athleteProfile: athleteProfileSchema
    .extend({ assignedCoaches: z.array(coachListItemSchema) })
    .nullable(),
  coachProfile: coachProfileSchema.nullable(),
});
