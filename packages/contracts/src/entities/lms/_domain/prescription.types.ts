import { type z } from "zod";

import { type prescriptionSchema } from "./prescription.schema";

export type Prescription = z.infer<typeof prescriptionSchema>;
