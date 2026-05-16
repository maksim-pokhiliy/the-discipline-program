import { type z } from "zod";

import { type createLabelSchema, type labelSchema, type updateLabelSchema } from "./label.schema";

export type Label = z.infer<typeof labelSchema>;

export type CreateLabelData = z.infer<typeof createLabelSchema>;

export type UpdateLabelData = z.infer<typeof updateLabelSchema>;
