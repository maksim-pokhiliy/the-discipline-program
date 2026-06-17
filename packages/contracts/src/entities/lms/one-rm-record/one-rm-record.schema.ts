import { z } from "zod";

import { OneRMRecordSource } from "./one-rm-record.constants";

export const oneRMRecordSourceSchema = z.nativeEnum(OneRMRecordSource);

export const oneRMRecordSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  valueKg: z.number().finite().positive(),
  recordedAt: z.coerce.date(),
  source: oneRMRecordSourceSchema,
});

export const createOneRMRecordSchema = z.object({
  exerciseId: z.string().cuid(),
  valueKg: z.number().finite().positive(),
  recordedAt: z.coerce.date(),
  source: oneRMRecordSourceSchema,
});
