import { type z } from "zod";

import {
  type addMemberAlternatingGroupRequestSchema,
  type addMemberAlternatingGroupResponseSchema,
  type createAlternatingGroupRequestSchema,
  type createAlternatingGroupResponseSchema,
  type deleteAlternatingGroupParamsSchema,
  type getAlternatingGroupsResponseSchema,
  type removeMemberAlternatingGroupRequestSchema,
  type removeMemberAlternatingGroupResponseSchema,
} from "./alternating-group-api.schema";

export type GetAlternatingGroupsResponse = z.infer<typeof getAlternatingGroupsResponseSchema>;
export type CreateAlternatingGroupRequest = z.infer<typeof createAlternatingGroupRequestSchema>;
export type CreateAlternatingGroupResponse = z.infer<typeof createAlternatingGroupResponseSchema>;
export type AddMemberAlternatingGroupRequest = z.infer<
  typeof addMemberAlternatingGroupRequestSchema
>;
export type AddMemberAlternatingGroupResponse = z.infer<
  typeof addMemberAlternatingGroupResponseSchema
>;
export type RemoveMemberAlternatingGroupRequest = z.infer<
  typeof removeMemberAlternatingGroupRequestSchema
>;
export type RemoveMemberAlternatingGroupResponse = z.infer<
  typeof removeMemberAlternatingGroupResponseSchema
>;
export type DeleteAlternatingGroupParams = z.infer<typeof deleteAlternatingGroupParamsSchema>;
