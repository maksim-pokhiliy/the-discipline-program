import { afterAll } from "vitest";

import { prisma } from "../db/client";

afterAll(async () => {
  await prisma.$disconnect();
});
