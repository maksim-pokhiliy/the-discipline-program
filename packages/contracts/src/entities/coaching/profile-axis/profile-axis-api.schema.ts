import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  createProfileAxisSchema,
  profileAxisSchema,
  updateProfileAxisSchema,
} from "./profile-axis.schema";

export const getProfileAxesResponseSchema = z.array(profileAxisSchema);
export const getProfileAxisByIdParamsSchema = idParamSchema;
export const createProfileAxisRequestSchema = createProfileAxisSchema;
export const updateProfileAxisParamsSchema = idParamSchema;
export const updateProfileAxisRequestSchema = updateProfileAxisSchema;
export const deleteProfileAxisParamsSchema = idParamSchema;
export const getProfileAxesPageDataResponseSchema = z.object({
  profileAxes: getProfileAxesResponseSchema,
});
