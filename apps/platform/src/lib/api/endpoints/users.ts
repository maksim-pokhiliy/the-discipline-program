import { type ApiClient } from "@repo/api-client";

type UserSearchResult = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export const createUsersAPI = (client: ApiClient) => ({
  search: (query: string): Promise<UserSearchResult[]> =>
    client.request(`/api/platform/users/search?q=${encodeURIComponent(query)}`, "GET"),
});
