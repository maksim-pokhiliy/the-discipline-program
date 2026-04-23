import { type ApiClient } from "@repo/api-client";
import type {
  BlockType,
  CreateBlockTypeData,
  UpdateBlockTypeData,
} from "@repo/contracts/library/block-type";

const BASE = "/api/admin/library/block-types";

const toQueryRecord = (query: { includeInactive?: boolean }): Record<string, string> => {
  const record: Record<string, string> = {};

  if (query.includeInactive !== undefined) {
    record.includeInactive = String(query.includeInactive);
  }

  return record;
};

export const createLibraryBlockTypesAPI = (client: ApiClient) => ({
  list: (query: { includeInactive?: boolean } = {}): Promise<BlockType[]> =>
    client.request(BASE, "GET", undefined, toQueryRecord(query)),

  getById: (id: string): Promise<BlockType> => client.request(`${BASE}/${id}`),

  create: (data: CreateBlockTypeData): Promise<BlockType> => client.request(BASE, "POST", data),

  update: (id: string, data: UpdateBlockTypeData): Promise<BlockType> =>
    client.request(`${BASE}/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`${BASE}/${id}`, "DELETE"),
});
