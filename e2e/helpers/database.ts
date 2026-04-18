import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

const getPrisma = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
};

export const seedTestBlogPost = async () => {
  const prisma = getPrisma();
  const ts = Date.now();
  return prisma.marketingBlogPost.create({
    data: {
      slug: `e2e-test-${ts}`,
      title: `E2E Test Post ${ts}`,
      content:
        "Created by E2E test. This content needs to be at least 100 characters long to pass the blog post content validation schema. Adding some extra text to reach the minimum.",
      authorName: "E2E",
    },
  });
};

export const seedTestContact = async () => {
  const prisma = getPrisma();
  return prisma.marketingContactSubmission.create({
    data: {
      name: "E2E Test Contact",
      contact: "e2e@test.com",
      message: "Created by E2E test for deletion",
      program: "Test Program",
    },
  });
};

export const cleanupByIds = async (entries: { table: string; id: string }[]) => {
  const prisma = getPrisma();
  for (const { table, id } of entries.reverse()) {
    const delegate = (prisma as Record<string, unknown>)[table] as
      | { delete: (args: { where: { id: string } }) => Promise<unknown> }
      | undefined;
    if (delegate) {
      await delegate.delete({ where: { id } }).catch(() => {});
    }
  }
};

export const disconnectDb = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};
