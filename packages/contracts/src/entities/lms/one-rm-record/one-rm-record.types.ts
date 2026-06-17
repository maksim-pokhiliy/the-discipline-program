import { type z } from "zod";

import {
  type createOneRMRecordSchema,
  type oneRMRecordSchema,
  type oneRMRecordSourceSchema,
} from "./one-rm-record.schema";

export type OneRMRecord = z.infer<typeof oneRMRecordSchema>;
export type OneRMRecordSourceValue = z.infer<typeof oneRMRecordSourceSchema>;
export type CreateOneRMRecordData = z.infer<typeof createOneRMRecordSchema>;
