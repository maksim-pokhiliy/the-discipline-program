import { z } from "zod";

import { createOneRMRecordSchema, oneRMRecordSchema } from "./one-rm-record.schema";

export const getOneRMRecordsQuerySchema = z.object({
  exerciseId: z.string().cuid().optional(),
});

export const getOneRMRecordsResponseSchema = z.object({
  records: z.array(oneRMRecordSchema),
});

export const createOneRMRecordRequestSchema = createOneRMRecordSchema;

export const createOneRMRecordResponseSchema = oneRMRecordSchema;
