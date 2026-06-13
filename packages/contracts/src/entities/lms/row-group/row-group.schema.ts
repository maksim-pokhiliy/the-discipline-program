import { z } from "zod";

import { notesListSchema } from "../_shared";

import { ROW_GROUP_CONSTANTS } from "./row-group.constants";

export const rowGroupSchema = z.object({
  id: z.string().cuid(),
  schemaId: z.string().cuid(),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createRowGroupRequestSchema = z
  .object({
    schemaId: z.string().cuid(),
    rowIds: z.array(z.string().cuid()).min(2).max(ROW_GROUP_CONSTANTS.MAX_ROWS_PER_GROUP),
    notes: notesListSchema.nullable().optional(),
  })
  .strict();

export const updateRowGroupRequestSchema = z
  .object({
    notes: notesListSchema.nullable().optional(),
  })
  .strict();
