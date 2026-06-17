import { type z } from "zod";

import {
  type createOneRMRecordRequestSchema,
  type createOneRMRecordResponseSchema,
  type getOneRMRecordsQuerySchema,
  type getOneRMRecordsResponseSchema,
} from "./one-rm-record-api.schema";

export type GetOneRMRecordsQuery = z.infer<typeof getOneRMRecordsQuerySchema>;
export type GetOneRMRecordsResponse = z.infer<typeof getOneRMRecordsResponseSchema>;
export type CreateOneRMRecordRequest = z.infer<typeof createOneRMRecordRequestSchema>;
export type CreateOneRMRecordResponse = z.infer<typeof createOneRMRecordResponseSchema>;
