import { type z } from "zod";

import { type libraryScopeSchema } from "./library-scope.schema";

export type LibraryScope = z.infer<typeof libraryScopeSchema>;

export const LIBRARY_SCOPES: readonly LibraryScope[] = ["SYSTEM", "COACH"] as const;
