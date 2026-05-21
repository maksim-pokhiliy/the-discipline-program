import { type ApiClient } from "@repo/api-client";
import type {
  AddMemberAlternatingGroupRequest,
  AlternatingGroup,
  CreateAlternatingGroupRequest,
} from "@repo/contracts/lms/alternating-group";

export const createAlternatingGroupsAPI = (client: ApiClient) => ({
  create: (planId: string, data: CreateAlternatingGroupRequest): Promise<AlternatingGroup> =>
    client.request(`/api/platform/training-plans/${planId}/alternating-groups`, "POST", data),

  delete: (planId: string, groupId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/alternating-groups/${groupId}`,
      "DELETE",
    ),

  addMember: (
    planId: string,
    groupId: string,
    data: AddMemberAlternatingGroupRequest,
  ): Promise<AlternatingGroup> =>
    client.request(
      `/api/platform/training-plans/${planId}/alternating-groups/${groupId}/members`,
      "POST",
      data,
    ),

  removeMember: (
    planId: string,
    groupId: string,
    schemaId: string,
  ): Promise<AlternatingGroup | null> =>
    client.request(
      `/api/platform/training-plans/${planId}/alternating-groups/${groupId}/members/${schemaId}`,
      "DELETE",
    ),
});
