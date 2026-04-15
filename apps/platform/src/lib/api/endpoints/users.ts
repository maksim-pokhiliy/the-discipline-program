import { type ApiClient } from "@repo/api-client";
import type { UserSearchResult } from "@repo/contracts/iam/user";

export const createUsersAPI = (client: ApiClient) => ({
  search: (query: string): Promise<UserSearchResult[]> =>
    client.request("/api/platform/users/search", "GET", undefined, { q: query }),
});
