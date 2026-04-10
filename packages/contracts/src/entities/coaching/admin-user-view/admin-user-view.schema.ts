import { userSchema } from "../../iam/user";
import { athleteProfileSchema } from "../athlete-profile";
import { coachProfileSchema } from "../coach-profile";

export const adminUserViewSchema = userSchema.extend({
  athleteProfile: athleteProfileSchema.nullable(),
  coachProfile: coachProfileSchema.nullable(),
});
