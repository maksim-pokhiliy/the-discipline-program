import { type ApiClient } from "@repo/api-client";
import type {
  CreateBenchmarkResultRequest,
  CreateBenchmarkResultResponse,
} from "@repo/contracts/lms/benchmark-result";

export const createBenchmarkResultsAPI = (client: ApiClient) => ({
  create: (
    sessionId: string,
    data: CreateBenchmarkResultRequest,
    idempotencyKey?: string,
  ): Promise<CreateBenchmarkResultResponse> =>
    client.request(
      `/api/platform/athlete/sessions/${sessionId}/result`,
      "POST",
      data,
      undefined,
      idempotencyKey === undefined ? undefined : { idempotencyKey },
    ),
});
