import { type z } from "zod";

import {
  type createGroupRequestSchema,
  type groupTrackSchema,
  type schemaGroupSchema,
  type updateGroupRequestSchema,
} from "./schema-group.schema";

export type SchemaGroup = z.infer<typeof schemaGroupSchema>;
export type GroupTrack = z.infer<typeof groupTrackSchema>;
export type CreateGroupRequest = z.infer<typeof createGroupRequestSchema>;
export type UpdateGroupRequest = z.infer<typeof updateGroupRequestSchema>;
