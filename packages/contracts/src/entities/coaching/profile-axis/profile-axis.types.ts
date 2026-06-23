import { type z } from "zod";

import {
  type createProfileAxisSchema,
  type profileAxisSchema,
  type updateProfileAxisSchema,
} from "./profile-axis.schema";

export type ProfileAxis = z.infer<typeof profileAxisSchema>;
export type CreateProfileAxisData = z.infer<typeof createProfileAxisSchema>;
export type UpdateProfileAxisData = z.infer<typeof updateProfileAxisSchema>;
