import { z } from "zod";

export const rxStatusSchema = z.enum(["RX", "SCALED", "SUBSTITUTED", "MODIFIED"]);
