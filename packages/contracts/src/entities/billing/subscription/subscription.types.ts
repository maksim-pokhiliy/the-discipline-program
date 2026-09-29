import { type z } from "zod";

import { type subscriptionSchema } from "./subscription.schema";

export type Subscription = z.infer<typeof subscriptionSchema>;
