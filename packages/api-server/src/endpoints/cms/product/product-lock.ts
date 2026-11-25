import { type Prisma } from "@prisma/client";

export const lockProduct = async (
  tx: Pick<Prisma.TransactionClient, "$executeRaw">,
  productId: string,
): Promise<void> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cms-product:${productId}`}))`;
};
