import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "app_workouts"
    SET "scheduledDate" = CASE
      WHEN EXTRACT(HOUR FROM "scheduledDate") >= 12
        THEN DATE_TRUNC('day', "scheduledDate") + INTERVAL '1 day'
      ELSE DATE_TRUNC('day', "scheduledDate")
    END
    WHERE "scheduledDate" IS NOT NULL
      AND EXTRACT(HOUR FROM "scheduledDate") != 0
  `);

  console.log(`Normalized ${result} workout scheduled dates to UTC midnight`);
};

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
