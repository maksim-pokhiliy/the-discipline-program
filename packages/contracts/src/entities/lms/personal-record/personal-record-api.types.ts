import { type z } from "zod";

import {
  type getPersonalRecordResponseSchema,
  type listPersonalRecordsQuerySchema,
  type listPersonalRecordsResponseSchema,
  type personalRecordIdParamSchema,
  type upsertPersonalRecordInputSchema,
  type upsertPersonalRecordResponseSchema,
} from "./personal-record-api.schema";

export type UpsertPersonalRecordInput = z.infer<typeof upsertPersonalRecordInputSchema>;
export type PersonalRecordIdParam = z.infer<typeof personalRecordIdParamSchema>;
export type ListPersonalRecordsQuery = z.infer<typeof listPersonalRecordsQuerySchema>;
export type ListPersonalRecordsResponse = z.infer<typeof listPersonalRecordsResponseSchema>;
export type GetPersonalRecordResponse = z.infer<typeof getPersonalRecordResponseSchema>;
export type UpsertPersonalRecordResponse = z.infer<typeof upsertPersonalRecordResponseSchema>;
