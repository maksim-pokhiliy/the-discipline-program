import { type z } from "zod";

import { type weekSchema } from "./week.schema";

export type Week = z.infer<typeof weekSchema>;
