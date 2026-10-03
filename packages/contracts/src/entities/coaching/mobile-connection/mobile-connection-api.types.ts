import { type z } from "zod";

import {
  type connectMobileRequestSchema,
  type connectMobileResponseSchema,
  type getMobileConnectionsResponseSchema,
  type getTrainingLevelsResponseSchema,
} from "./mobile-connection-api.schema";

export type ConnectMobileRequest = z.infer<typeof connectMobileRequestSchema>;
export type ConnectMobileResponse = z.infer<typeof connectMobileResponseSchema>;
export type GetMobileConnectionsResponse = z.infer<typeof getMobileConnectionsResponseSchema>;
export type GetTrainingLevelsResponse = z.infer<typeof getTrainingLevelsResponseSchema>;
