import { PrismaClient } from "@prisma/client";

import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

const prisma = new PrismaClient();

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const main = async () => {
  let createdPages = 0;
  let createdSections = 0;

  for (const slug of Object.values(PageSlug)) {
    const existing = await prisma.marketingPage.findUnique({ where: { slug } });

    if (!existing) {
      await prisma.marketingPage.create({ data: { slug, title: capitalize(slug) } });
      createdPages++;
      console.log(`  + page: ${slug}`);
    } else {
      console.log(`  ~ page: ${slug} (already exists, skipped)`);
    }

    const sectionKeys = Object.values(PAGE_SECTIONS_MAP[slug]);

    for (const section of sectionKeys) {
      const existingSection = await prisma.marketingPageSection.findUnique({
        where: { pageSlug_section: { pageSlug: slug, section } },
      });

      if (!existingSection) {
        await prisma.marketingPageSection.create({
          data: { pageSlug: slug, section, data: {}, isActive: true },
        });
        createdSections++;
        console.log(`    + section: ${section}`);
      } else {
        console.log(`    ~ section: ${section} (already exists, skipped)`);
      }
    }
  }

  console.log(`\nDone. Created ${createdPages} pages and ${createdSections} sections.`);
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
