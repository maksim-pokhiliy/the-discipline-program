import { type prisma } from "./client";

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
