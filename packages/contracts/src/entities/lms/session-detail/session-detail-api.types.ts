import { type z } from "zod";

import {
  type sessionDetailParamsSchema,
  type sessionDetailResponseSchema,
} from "./session-detail-api.schema";
import {
  type blockItemViewSchema,
  type blockViewSchema,
  type resolvedLoadSchema,
  type resolvedLoadSourceSchema,
  type rowItemViewSchema,
  type rowViewSchema,
  type schemaCardViewSchema,
  type sessionDetailViewSchema,
  type sessionHeaderViewSchema,
} from "./session-detail.schema";

export type ResolvedLoad = z.infer<typeof resolvedLoadSchema>;
export type ResolvedLoadSource = z.infer<typeof resolvedLoadSourceSchema>;
export type RowView = z.infer<typeof rowViewSchema>;
export type RowItemView = z.infer<typeof rowItemViewSchema>;
export type SchemaCardView = z.infer<typeof schemaCardViewSchema>;
export type BlockItemView = z.infer<typeof blockItemViewSchema>;
export type BlockView = z.infer<typeof blockViewSchema>;
export type SessionHeaderView = z.infer<typeof sessionHeaderViewSchema>;
export type SessionDetailView = z.infer<typeof sessionDetailViewSchema>;
export type SessionDetailParams = z.infer<typeof sessionDetailParamsSchema>;
export type SessionDetailResponse = z.infer<typeof sessionDetailResponseSchema>;
