import { z } from "zod";

import { idParamSchema } from "../../../common";

import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

export const getAlternatingGroupsResponseSchema = z.array(alternatingGroupSchema);

export const createAlternatingGroupRequestSchema = createAlternatingGroupSchema;
export const createAlternatingGroupResponseSchema = alternatingGroupSchema;

export const deleteAlternatingGroupParamsSchema = idParamSchema;
