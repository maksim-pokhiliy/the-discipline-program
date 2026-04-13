import { prisma } from "../../db/client";
import { checkBlobStorage } from "../../infrastructure/storage";

export const checkDatabase = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};

export { checkBlobStorage };
