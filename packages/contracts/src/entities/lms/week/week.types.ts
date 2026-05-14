import { type z } from "zod";

import { type updateWeekNotesSchema, type weekSchema } from "./week.schema";

export type Week = z.infer<typeof weekSchema>;
export type UpdateWeekNotesData = z.infer<typeof updateWeekNotesSchema>;
