import { type ApiClient } from "@repo/api-client";
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  SchemaGroup,
  UpdateGroupRequest,
} from "@repo/contracts/lms/schema-group";

export const createGroupsAPI = (client: ApiClient) => ({
  create: (planId: string, data: CreateGroupRequest): Promise<CreateGroupResponse> =>
    client.request(`/api/platform/training-plans/${planId}/groups`, "POST", data),

  update: (planId: string, groupId: string, data: UpdateGroupRequest): Promise<SchemaGroup> =>
    client.request(`/api/platform/training-plans/${planId}/groups/${groupId}`, "PUT", data),

  delete: (planId: string, groupId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/groups/${groupId}`, "DELETE"),
});
