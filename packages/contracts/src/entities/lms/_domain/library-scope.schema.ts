import { z } from "zod";

export const libraryScopeSchema = z.enum(["SYSTEM", "COACH"]);
