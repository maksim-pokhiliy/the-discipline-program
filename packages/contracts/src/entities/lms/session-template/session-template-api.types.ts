import { type z } from "zod";

import {
  type createSessionTemplateInputSchema,
  type createSessionTemplateResponseSchema,
  type demoteSessionTemplateInputSchema,
  type demoteSessionTemplateResponseSchema,
  type getSessionTemplateResponseSchema,
  type listSessionTemplatesQuerySchema,
  type listSessionTemplatesResponseSchema,
  type promoteSessionTemplateResponseSchema,
  type sessionTemplateIdParamSchema,
  type updateSessionTemplateInputSchema,
  type updateSessionTemplateResponseSchema,
} from "./session-template-api.schema";

export type CreateSessionTemplateInput = z.infer<typeof createSessionTemplateInputSchema>;
export type UpdateSessionTemplateInput = z.infer<typeof updateSessionTemplateInputSchema>;
export type SessionTemplateIdParam = z.infer<typeof sessionTemplateIdParamSchema>;
export type ListSessionTemplatesQuery = z.infer<typeof listSessionTemplatesQuerySchema>;
export type ListSessionTemplatesResponse = z.infer<typeof listSessionTemplatesResponseSchema>;
export type GetSessionTemplateResponse = z.infer<typeof getSessionTemplateResponseSchema>;
export type CreateSessionTemplateResponse = z.infer<typeof createSessionTemplateResponseSchema>;
export type UpdateSessionTemplateResponse = z.infer<typeof updateSessionTemplateResponseSchema>;
export type PromoteSessionTemplateResponse = z.infer<typeof promoteSessionTemplateResponseSchema>;
export type DemoteSessionTemplateInput = z.infer<typeof demoteSessionTemplateInputSchema>;
export type DemoteSessionTemplateResponse = z.infer<typeof demoteSessionTemplateResponseSchema>;
