import { type z } from "zod";

import { type connectMobileSchema, type mobileConnectionSchema } from "./mobile-connection.schema";

export type MobileConnection = z.infer<typeof mobileConnectionSchema>;
export type ConnectMobileData = z.infer<typeof connectMobileSchema>;
