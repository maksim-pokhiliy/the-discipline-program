import { z } from "zod";

import { restSpecSchema } from "../_domain/rest-spec.schema";

import { SET_GROUP_CONSTANTS } from "./set-group.constants";

export const setGroupSchema = z.object({
  id: z.string().cuid(),
  segmentId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(SET_GROUP_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  restConfig: restSpecSchema.nullable(),
});
