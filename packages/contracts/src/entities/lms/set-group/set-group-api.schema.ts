import { z } from "zod";

import { restSpecSchema } from "../_domain/rest-spec.schema";

import { SET_GROUP_CONSTANTS } from "./set-group.constants";
import { setGroupSchema } from "./set-group.schema";

export const createSetGroupInputSchema = z.object({
  segmentId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(SET_GROUP_CONSTANTS.MAX_LABEL_LENGTH).optional(),
  restConfig: restSpecSchema.optional(),
});

export const updateSetGroupInputSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  label: z.string().max(SET_GROUP_CONSTANTS.MAX_LABEL_LENGTH).nullable().optional(),
  restConfig: restSpecSchema.nullable().optional(),
});

export const setGroupIdParamSchema = z.object({ setGroupId: z.string().cuid() });

export const getSetGroupResponseSchema = setGroupSchema;
export const createSetGroupResponseSchema = setGroupSchema;
export const updateSetGroupResponseSchema = setGroupSchema;
