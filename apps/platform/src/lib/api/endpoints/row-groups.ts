import { type ApiClient } from "@repo/api-client";
import type {
  CreateRowGroupRequest,
  CreateRowGroupResponse,
  RowGroup,
  UpdateRowGroupRequest,
} from "@repo/contracts/lms/row-group";

export const createRowGroupsAPI = (client: ApiClient) => ({
  create: (planId: string, data: CreateRowGroupRequest): Promise<CreateRowGroupResponse> =>
    client.request(`/api/platform/training-plans/${planId}/row-groups`, "POST", data),

  update: (planId: string, rowGroupId: string, data: UpdateRowGroupRequest): Promise<RowGroup> =>
    client.request(`/api/platform/training-plans/${planId}/row-groups/${rowGroupId}`, "PUT", data),

  delete: (planId: string, rowGroupId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/row-groups/${rowGroupId}`,
      "DELETE",
    ),
});
