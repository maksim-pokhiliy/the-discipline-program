import { type z } from "zod";

import { type recordsViewResponseSchema } from "./records-view-api.schema";
import {
  type benchmarkDeltaSchema,
  type benchmarkRecordViewSchema,
  type benchmarkSeriesPointSchema,
  type oneRMRecordViewSchema,
  type oneRMSeriesPointSchema,
  type recordsViewSchema,
} from "./records-view.schema";

export type OneRMSeriesPoint = z.infer<typeof oneRMSeriesPointSchema>;
export type OneRMRecordView = z.infer<typeof oneRMRecordViewSchema>;
export type BenchmarkSeriesPoint = z.infer<typeof benchmarkSeriesPointSchema>;
export type BenchmarkDelta = z.infer<typeof benchmarkDeltaSchema>;
export type BenchmarkRecordView = z.infer<typeof benchmarkRecordViewSchema>;
export type RecordsView = z.infer<typeof recordsViewSchema>;
export type RecordsViewResponse = z.infer<typeof recordsViewResponseSchema>;
