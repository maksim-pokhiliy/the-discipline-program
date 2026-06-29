import { type ApiClient } from "@repo/api-client";
import type {
  CreateOneRMRecordRequest,
  CreateOneRMRecordResponse,
  GetOneRMRecordsResponse,
} from "@repo/contracts/lms/one-rm-record";

export const createOneRMRecordsAPI = (client: ApiClient) => ({
  list: (exerciseId?: string): Promise<GetOneRMRecordsResponse> => {
    const queryParams: Record<string, string> = {
      ...(exerciseId !== undefined && { exerciseId }),
    };

    return client.request(
      "/api/platform/athlete/one-rm-records",
      "GET",
      undefined,
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
  },

  create: (
    data: CreateOneRMRecordRequest,
    idempotencyKey?: string,
  ): Promise<CreateOneRMRecordResponse> =>
    client.request(
      "/api/platform/athlete/one-rm-records",
      "POST",
      data,
      undefined,
      idempotencyKey === undefined ? undefined : { idempotencyKey },
    ),
});
