import { z } from "zod";

export const INT4_MAX = 2147483647;

export const orderFieldSchema = z.number().int().nonnegative().max(INT4_MAX);
