import { type ApiClient } from "@repo/api-client";
import type {
  CreatePerformedSchemaResultRequest,
  CreatePerformedSchemaResultResponse,
} from "@repo/contracts/lms/performed-schema-result";

export const createPerformedSchemaResultsAPI = (client: ApiClient) => ({
  create: (
    performedSessionId: string,
    data: CreatePerformedSchemaResultRequest,
  ): Promise<CreatePerformedSchemaResultResponse> =>
    client.request(
      `/api/platform/athlete/performed-sessions/${performedSessionId}/result`,
      "POST",
      data,
    ),
});
