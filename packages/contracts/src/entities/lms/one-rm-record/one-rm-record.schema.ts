import { z } from "zod";

import { kgSchema } from "../_shared";

import { OneRMRecordSource } from "./one-rm-record.constants";

export const oneRMRecordSourceSchema = z.nativeEnum(OneRMRecordSource);

export const oneRMRecordSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  valueKg: kgSchema,
  recordedAt: z.coerce.date(),
  source: oneRMRecordSourceSchema,
});

export const createOneRMRecordSchema = z.object({
  exerciseId: z.string().cuid(),
  valueKg: kgSchema,
  recordedAt: z.coerce.date(),
  source: oneRMRecordSourceSchema,
});
