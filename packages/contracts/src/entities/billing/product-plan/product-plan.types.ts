import { type z } from "zod";

import { type productPlanSchema } from "./product-plan.schema";

export type ProductPlan = z.infer<typeof productPlanSchema>;
