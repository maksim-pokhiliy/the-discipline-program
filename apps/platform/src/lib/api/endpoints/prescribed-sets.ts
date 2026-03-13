import { type ApiClient } from "@repo/api-client";
import type {
  CreatePrescribedSetData,
  PrescribedSet,
  UpdatePrescribedSetData,
} from "@repo/contracts/prescribed-set";

export const createPrescribedSetsAPI = (client: ApiClient) => ({
  getAll: (blockId: string): Promise<PrescribedSet[]> =>
    client.request(`/api/platform/blocks/${blockId}/sets`),

  getById: (blockId: string, id: string): Promise<PrescribedSet> =>
    client.request(`/api/platform/blocks/${blockId}/sets/${id}`),

  create: (blockId: string, data: CreatePrescribedSetData): Promise<PrescribedSet> =>
    client.request(`/api/platform/blocks/${blockId}/sets`, "POST", data),

  update: (blockId: string, id: string, data: UpdatePrescribedSetData): Promise<PrescribedSet> =>
    client.request(`/api/platform/blocks/${blockId}/sets/${id}`, "PUT", data),

  delete: (blockId: string, id: string): Promise<void> =>
    client.request(`/api/platform/blocks/${blockId}/sets/${id}`, "DELETE"),
});
