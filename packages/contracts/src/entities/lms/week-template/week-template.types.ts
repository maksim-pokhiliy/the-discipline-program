import { type z } from "zod";

import { type weekTemplateSchema } from "./week-template.schema";

export type WeekTemplate = z.infer<typeof weekTemplateSchema>;
