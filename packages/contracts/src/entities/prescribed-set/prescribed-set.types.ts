import { type z } from "zod";

import {
  type createPrescribedSetSchema,
  type prescribedSetSchema,
  type updatePrescribedSetSchema,
} from "./prescribed-set.schema";

export type PrescribedSet = z.infer<typeof prescribedSetSchema>;
export type CreatePrescribedSetData = z.infer<typeof createPrescribedSetSchema>;
export type UpdatePrescribedSetData = z.infer<typeof updatePrescribedSetSchema>;
