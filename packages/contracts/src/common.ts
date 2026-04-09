import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().cuid() });

export const planIdParamSchema = z.object({ planId: z.string().cuid() });
