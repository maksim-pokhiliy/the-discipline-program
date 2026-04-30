import { type z } from "zod";

import {
  type blockTemplatePayloadSchema,
  type sessionTemplatePayloadSchema,
  type weekTemplatePayloadSchema,
} from "./template-payload.schema";

export type BlockTemplatePayload = z.infer<typeof blockTemplatePayloadSchema>;
export type SessionTemplatePayload = z.infer<typeof sessionTemplatePayloadSchema>;
export type WeekTemplatePayload = z.infer<typeof weekTemplatePayloadSchema>;
