import { type z } from "zod";

import { type transactionSchema } from "./transaction.schema";

export type Transaction = z.infer<typeof transactionSchema>;
