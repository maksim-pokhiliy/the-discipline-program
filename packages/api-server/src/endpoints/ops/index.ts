import { prisma } from "../../db/client";

export const checkDatabase = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};
