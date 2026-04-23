import { type ApiClient } from "@repo/api-client";
import type { Scheme } from "@repo/contracts/library/scheme";

export const createLibrarySchemesAPI = (client: ApiClient) => ({
  list: (): Promise<Scheme[]> => client.request("/api/platform/library/schemes"),
});
