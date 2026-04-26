import { z } from "zod";

export const blockStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);
