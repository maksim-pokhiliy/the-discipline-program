import { type z } from "zod";

import {
  type personalRecordContextSchema,
  type personalRecordSchema,
} from "./personal-record.schema";

export type PersonalRecord = z.infer<typeof personalRecordSchema>;
export type PersonalRecordContext = z.infer<typeof personalRecordContextSchema>;
