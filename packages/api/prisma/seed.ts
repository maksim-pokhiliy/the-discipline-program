import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Seed admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@discipline.program" },
    update: {},
    create: {
      email: "admin@discipline.program",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("📝 Default password: admin123 (please change it!)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
