import { type ApiClient } from "@repo/api-client";
import {
  type GetPlanStructureQuery,
  type GetPlanStructureResponse,
} from "@repo/contracts/lms/training-plan";

const toQuery = (q: GetPlanStructureQuery | undefined): Record<string, string> => {
  const out: Record<string, string> = {};

  if (!q) {
    return out;
  }

  if (typeof q.fromWeek === "number") {
    out.fromWeek = String(q.fromWeek);
  }

  if (typeof q.toWeek === "number") {
    out.toWeek = String(q.toWeek);
  }

  return out;
};

export const createPlanStructureAPI = (client: ApiClient) => ({
  getStructure: (
    planId: string,
    query?: GetPlanStructureQuery,
  ): Promise<GetPlanStructureResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/structure`,
      "GET",
      undefined,
      toQuery(query),
    ),
});
