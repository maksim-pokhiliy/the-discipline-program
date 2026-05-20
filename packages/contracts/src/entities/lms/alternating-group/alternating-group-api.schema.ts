import { z } from "zod";

import { idParamSchema } from "../../../common";

import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

export const getAlternatingGroupsResponseSchema = z.array(alternatingGroupSchema);

export const createAlternatingGroupRequestSchema = createAlternatingGroupSchema;
export const createAlternatingGroupResponseSchema = alternatingGroupSchema;

export const addMemberAlternatingGroupRequestSchema = z.object({
  schemaId: z.string().cuid(),
});
export const addMemberAlternatingGroupResponseSchema = alternatingGroupSchema;

export const removeMemberAlternatingGroupRequestSchema = addMemberAlternatingGroupRequestSchema;
export const removeMemberAlternatingGroupResponseSchema = alternatingGroupSchema.nullable();

export const deleteAlternatingGroupParamsSchema = idParamSchema;
