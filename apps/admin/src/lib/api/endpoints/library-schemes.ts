import { type ApiClient } from "@repo/api-client";
import type { CreateSchemeData, Scheme, UpdateSchemeData } from "@repo/contracts/library/scheme";

const BASE = "/api/admin/library/schemes";

const toQueryRecord = (query: { includeInactive?: boolean }): Record<string, string> => {
  const record: Record<string, string> = {};

  if (query.includeInactive !== undefined) {
    record.includeInactive = String(query.includeInactive);
  }

  return record;
};

export const createLibrarySchemesAPI = (client: ApiClient) => ({
  list: (query: { includeInactive?: boolean } = {}): Promise<Scheme[]> =>
    client.request(BASE, "GET", undefined, toQueryRecord(query)),

  getById: (id: string): Promise<Scheme> => client.request(`${BASE}/${id}`),

  create: (data: CreateSchemeData): Promise<Scheme> => client.request(BASE, "POST", data),

  update: (id: string, data: UpdateSchemeData): Promise<Scheme> =>
    client.request(`${BASE}/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`${BASE}/${id}`, "DELETE"),
});
