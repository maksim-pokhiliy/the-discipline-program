import { type z } from "zod";

import { type setActualResultSchema, type setLogSchema } from "./set-log.schema";

export type SetLog = z.infer<typeof setLogSchema>;
export type SetActualResult = z.infer<typeof setActualResultSchema>;
