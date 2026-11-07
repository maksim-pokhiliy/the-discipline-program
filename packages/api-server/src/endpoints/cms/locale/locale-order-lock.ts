import { type Prisma } from "@prisma/client";

export const lockLocaleOrder = async (
  tx: Pick<Prisma.TransactionClient, "$executeRaw">,
): Promise<void> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('cms-locale-order'))`;
};
