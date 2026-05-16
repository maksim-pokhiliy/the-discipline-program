import { type ApiClient } from "@repo/api-client";
import type { Label, LabelSearchParams } from "@repo/contracts/lms/label";

export const createLabelsAPI = (client: ApiClient) => ({
  search: (query?: LabelSearchParams): Promise<Label[]> => {
    const queryParams: Record<string, string> = {
      ...(query?.q !== undefined && { q: query.q }),
      ...(query?.level !== undefined && { level: query.level }),
    };

    return client.request(
      "/api/platform/labels/search",
      "GET",
      undefined,
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
  },
});
