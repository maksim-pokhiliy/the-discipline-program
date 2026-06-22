import { type z } from "zod";

import {
  type createProfileAxisRequestSchema,
  type deleteProfileAxisParamsSchema,
  type getProfileAxesPageDataResponseSchema,
  type getProfileAxesResponseSchema,
  type getProfileAxisByIdParamsSchema,
  type updateProfileAxisParamsSchema,
  type updateProfileAxisRequestSchema,
} from "./profile-axis-api.schema";

export type GetProfileAxesResponse = z.infer<typeof getProfileAxesResponseSchema>;
export type GetProfileAxisByIdParams = z.infer<typeof getProfileAxisByIdParamsSchema>;
export type CreateProfileAxisRequest = z.infer<typeof createProfileAxisRequestSchema>;
export type UpdateProfileAxisParams = z.infer<typeof updateProfileAxisParamsSchema>;
export type UpdateProfileAxisRequest = z.infer<typeof updateProfileAxisRequestSchema>;
export type DeleteProfileAxisParams = z.infer<typeof deleteProfileAxisParamsSchema>;
export type GetProfileAxesPageDataResponse = z.infer<typeof getProfileAxesPageDataResponseSchema>;
export type AdminProfileAxesPageData = GetProfileAxesPageDataResponse;
