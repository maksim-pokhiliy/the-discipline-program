import { z } from "zod";

import { userSchema } from "../../iam/user";
import { athleteProfileSchema } from "../athlete-profile";
import { coachProfileSchema } from "../coach-profile";

export const adminUserViewSchema = userSchema.extend({
  hasPassword: z.boolean(),
  athleteProfile: athleteProfileSchema.nullable(),
  coachProfile: coachProfileSchema.nullable(),
});
