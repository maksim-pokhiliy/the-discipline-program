import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CrossFit-themed seed with Page entities...");

  // Cleanup
  await prisma.marketingPageSection.deleteMany();
  await prisma.marketingPage.deleteMany();
  await prisma.marketingFeature.deleteMany();
  await prisma.marketingStorefrontProgram.deleteMany();
  await prisma.marketingBlogPost.deleteMany();
  await prisma.marketingReview.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);
  const adminEmail = "admin@example.com";

  await prisma.user.create({
    data: {
      email: adminEmail,
      role: Role.ADMIN,
      password: passwordHash,
    },
  });

  console.log(`👤 Created Admin: ${adminEmail} / password123`);

  // 1. Create Pages
  const pages = [
    { slug: "home", title: "Home Page" },
    { slug: "about", title: "About Us" },
    { slug: "storefront", title: "Programs Storefront" },
    { slug: "blog", title: "The Whiteboard (Blog)" },
    { slug: "contact", title: "Contact Us" },
  ];

  for (const page of pages) {
    await prisma.marketingPage.create({ data: page });
  }

  // 2. Home Sections
  const homeSections = [
    {
      section: "hero",
      data: {
        title: "Forging Elite Discipline",
        subtitle:
          "Functional fitness for those who refuse to settle. Master gymnastics, weightlifting, and metabolic conditioning to prepare for the unknown.",
        buttonText: "Start Training",
        buttonHref: "/storefront",
        backgroundImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      section: "whyChoose",
      data: {
        title: "Why The Discipline Program?",
        subtitle:
          "Random workouts give random results. We provide a periodized system to crush your WODs.",
      },
    },
    {
      section: "storefront",
      data: {
        title: "Choose Your Track",
        subtitle: "From Open preparation to daily GPP (General Physical Preparedness).",
        backgroundImage:
          "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      section: "reviews",
      data: {
        title: "Community Results",
        subtitle: "Athletes hitting PRs and mastering new skills every day.",
      },
    },
    {
      section: "contact",
      data: {
        title: "Join The Box",
        subtitle: "Questions about scaling or equipment? Ask us.",
      },
    },
  ];

  for (const s of homeSections) {
    await prisma.marketingPageSection.create({
      data: { pageSlug: "home", section: s.section, data: s.data, isActive: true },
    });
  }

  // 3. About Sections
  const aboutSections = [
    {
      section: "about:hero",
      data: {
        title: "Head Coach",
        subtitle: "10 years in the affiliate community. Games athlete mindset.",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      section: "journey",
      data: {
        title: "Burpees, Barbells, and Belief",
        subtitle: "My path to the Games",
        timeline: [
          {
            year: "2013",
            title: "The Garage",
            description: "Started with a rusty barbell and a dream.",
          },
          {
            year: "2016",
            title: "First Certification",
            description: "Earned my L1 and started coaching local athletes.",
          },
          {
            year: "2019",
            title: "Regionals",
            description: "Qualified for Regionals as an individual athlete.",
          },
          {
            year: "2023",
            title: "The Discipline Program",
            description: "Launched the online platform to reach more athletes.",
          },
        ],
      },
    },
    {
      section: "credentials",
      data: {
        title: "Certifications",
        items: [
          { title: "CrossFit Level 3 (CCFT)", description: "Certified CrossFit Trainer" },
          { title: "USA Weightlifting L1", description: "Sports Performance Coach" },
          { title: "Burgener Strength", description: "Weightlifting Staff" },
        ],
      },
    },
    {
      section: "personal",
      data: {
        title: "Outside The Box",
        description:
          "When I'm not coaching the snatch or analyzing WOD times, I'm trail running or grilling huge amounts of protein.",
        image:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        name: "Denis Sergeev",
        role: "Head Coach & Founder",
      },
    },
    {
      section: "cta",
      data: {
        title: "3... 2... 1... GO!",
        subtitle: "The clock is ticking. Are you ready to work?",
        buttonText: "Join The Program",
        buttonHref: "/storefront",
      },
    },
  ];

  for (const s of aboutSections) {
    await prisma.marketingPageSection.create({
      data: { pageSlug: "about", section: s.section, data: s.data, isActive: true },
    });
  }

  // 4. Hero sections for other pages
  const heroes = [
    {
      slug: "storefront",
      section: "storefront:hero",
      title: "Programming Tracks",
      subtitle: "Structured paths for Competitors and Everyday Athletes.",
    },
    {
      slug: "blog",
      section: "blog:hero",
      title: "The Whiteboard",
      subtitle: "WOD tips, movement standards, and nutrition advice.",
    },
    {
      slug: "contact",
      section: "contact:hero",
      title: "Drop Us A Line",
      subtitle: "We love talking shop.",
    },
  ];

  for (const h of heroes) {
    await prisma.marketingPageSection.create({
      data: {
        pageSlug: h.slug,
        section: h.section,
        data: {
          title: h.title,
          subtitle: h.subtitle,
          backgroundImage:
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
        },
        isActive: true,
      },
    });
  }

  // 5. Contact Specific
  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "form",
      data: {
        title: "Get in Touch",
        subtitle: "Feedback on programming?",
        programs: [
          { value: "competitor", label: "The Competitor" },
          { value: "performance", label: "Performance Rx" },
          { value: "engine", label: "Engine Builder" },
          { value: "general", label: "General Question" },
        ],
      },
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "directContact",
      data: {
        title: "Contact Info",
        contacts: [
          {
            type: "email",
            label: "Email",
            value: "coach@crossfitdiscipline.com",
            href: "mailto:coach@crossfitdiscipline.com",
          },
          { type: "phone", label: "Phone", value: "+1 (555) WOD-TIME", href: "tel:+15559638463" },
        ],
        workingHours: "Mon-Fri: 6am - 8pm\nSat: 8am - 12pm\nSun: Rest Day",
      },
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "faq",
      data: {
        title: "FAQ",
        items: [
          {
            question: "Do I need a gym membership?",
            answer: "Yes, access to equipment is required.",
          },
          { question: "How long are the sessions?", answer: "Typically 60 minutes." },
        ],
      },
    },
  });

  // 6. Features, Programs, Posts, Reviews (Same as before)
  await prisma.marketingFeature.createMany({
    data: [
      {
        title: "Constantly Varied",
        description: "No two days are the same.",
        iconName: "Shuffle",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "High Intensity",
        description: "Maximize power output.",
        iconName: "Bolt",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Functional Movement",
        description: "Transfer to real life.",
        iconName: "FitnessCenter",
        sortOrder: 3,
        isActive: true,
      },
    ],
  });

  await prisma.marketingStorefrontProgram.createMany({
    data: [
      {
        title: "The Competitor",
        slug: "competitor-track",
        description: "High-volume programming.",
        priceLabel: "$69",
        features: ["2 Sessions/Day"],
        isActive: true,
      },
      {
        title: "Performance Rx",
        slug: "performance-rx",
        description: "Daily WOD for dedicated athletes.",
        priceLabel: "$49",
        features: ["60 Min Sessions"],
        isActive: true,
      },
    ],
  });

  await prisma.marketingBlogPost.create({
    data: {
      title: "Mastering the Bar Muscle-Up",
      slug: "mastering-bar-muscle-up",
      excerpt: "Stop struggling with the chicken wing.",
      content: "## Technical Breakdown...",
      authorName: "Coach Ben",
      category: "Gymnastics",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.marketingReview.createMany({
    data: [
      {
        authorName: "Mat F.",
        authorRole: "Games Athlete",
        text: "Hit PRs every week.",
        rating: 5,
        isActive: true,
      },
    ],
  });

  console.log("✅ Seed completed with relational integrity!");
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
