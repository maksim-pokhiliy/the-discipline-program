import { type z } from "zod";

import { type getDashboardDataResponseSchema } from "./dashboard-api.schema";

export type DashboardData = z.infer<typeof getDashboardDataResponseSchema>;

export type ContentStats = DashboardData["contentStats"];
