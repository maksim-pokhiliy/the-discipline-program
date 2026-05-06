import { type ApiClient } from "@repo/api-client";
import {
  type AdminBlockTypesPageData,
  type BlockType,
  type CreateBlockTypeData,
  type UpdateBlockTypeData,
} from "@repo/contracts/lms/block-type";

export const createBlockTypesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminBlockTypesPageData> =>
    client.request("/api/admin/block-types/page-data"),

  getById: (id: string): Promise<BlockType> => client.request(`/api/admin/block-types/${id}`),

  create: (data: CreateBlockTypeData): Promise<BlockType> =>
    client.request("/api/admin/block-types", "POST", data),

  update: (id: string, data: UpdateBlockTypeData): Promise<BlockType> =>
    client.request(`/api/admin/block-types/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/block-types/${id}`, "DELETE"),
});
