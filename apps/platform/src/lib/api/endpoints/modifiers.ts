import { type ApiClient } from "@repo/api-client";
import type {
  CreateModifierData,
  Modifier,
  ModifierSearchParams,
} from "@repo/contracts/lms/modifier";

export const createModifiersAPI = (client: ApiClient) => ({
  search: (query?: ModifierSearchParams): Promise<Modifier[]> => {
    const queryParams: Record<string, string> = {
      ...(query?.q !== undefined && { q: query.q }),
    };

    return client.request(
      "/api/platform/modifiers/search",
      "GET",
      undefined,
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
  },

  create: (data: CreateModifierData): Promise<Modifier> =>
    client.request("/api/platform/modifiers", "POST", data),
});
