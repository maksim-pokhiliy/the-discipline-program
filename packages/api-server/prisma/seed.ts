import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CrossFit-themed seed...");

  // 1. Cleanup
  await prisma.marketingPageSection.deleteMany();
  await prisma.marketingFeature.deleteMany();
  await prisma.marketingProgramPreview.deleteMany();
  await prisma.marketingBlogPost.deleteMany();
  await prisma.marketingReview.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash("password", 12);
  const adminEmail = "admin@example.com";

  await prisma.user.create({
    data: {
      email: adminEmail,
      role: Role.ADMIN,
      password: passwordHash,
    },
  });
  console.log(`👤 Created Admin: ${adminEmail} / password`);

  // =========================================================================
  // MARKETING PAGES CONTENT (CMS)
  // =========================================================================

  // --- HOME PAGE ---
  const homeSections = [
    {
      section: "hero",
      data: {
        title: "Forging Elite Discipline",
        subtitle:
          "Functional fitness for those who refuse to settle. Master gymnastics, weightlifting, and metabolic conditioning to prepare for the unknown.",
        ctaText: "Start Training",
        ctaLink: "/programs",
        ctaHref: "/programs",
        // ЗАМЕНА: Рабочая ссылка (Barbell/Gym)
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
      section: "programs",
      data: {
        title: "Choose Your Track",
        subtitle: "From Open preparation to daily GPP (General Physical Preparedness).",
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

  // --- ABOUT PAGE ---
  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "about",
      section: "hero",
      data: {
        title: "Head Coach",
        subtitle: "10 years in the affiliate community. Games athlete mindset.",
        // ЗАМЕНА: Рабочая ссылка
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "about",
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
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "about",
      section: "credentials",
      data: {
        title: "Certifications",
        items: [
          { title: "CrossFit Level 3 (CCFT)", description: "Certified CrossFit Trainer" },
          { title: "USA Weightlifting L1", description: "Sports Performance Coach" },
          { title: "Burgener Strength", description: "Weightlifting Staff" },
        ],
      },
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "about",
      section: "personal",
      data: {
        title: "Outside The Box",
        content:
          "When I'm not coaching the snatch or analyzing WOD times, I'm trail running or grilling huge amounts of protein. I believe fitness is a hedge against sickness and a path to mental fortitude.",
        image:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1000&q=80",
      },
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "about",
      section: "cta",
      data: {
        title: "3... 2... 1... GO!",
        subtitle: "The clock is ticking. Are you ready to work?",
        ctaText: "Join The Program",
        ctaLink: "/programs",
      },
      isActive: true,
    },
  });

  // --- OTHER CMS SECTIONS ---
  const otherPages = [
    {
      slug: "programs",
      title: "Programming Tracks",
      subtitle: "Structured paths for Competitors and Everyday Athletes.",
    },
    {
      slug: "blog",
      title: "The Whiteboard",
      subtitle: "WOD tips, movement standards, and nutrition advice.",
    },
    { slug: "contact", title: "Drop Us A Line", subtitle: "We love talking shop." },
  ];

  for (const page of otherPages) {
    await prisma.marketingPageSection.create({
      data: {
        pageSlug: page.slug,
        section: "hero",
        data: {
          title: page.title,
          subtitle: page.subtitle,
          backgroundImage:
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
        },
        isActive: true,
      },
    });
  }

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
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "directContact",
      data: { email: "coach@crossfitdiscipline.com", phone: "+1 (555) WOD-TIME" },
      isActive: true,
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
            answer:
              "Yes, most programs assume access to barbells, rig, and space for dynamic movement.",
          },
          {
            question: "How long are the sessions?",
            answer:
              "Typically 60 minutes, including warmup and cool-down. Competitor track is 90+ mins.",
          },
        ],
      },
      isActive: true,
    },
  });

  console.log("✨ Created CMS Sections");

  // =========================================================================
  // DOMAIN CONTENT
  // =========================================================================

  // 1. Features (CrossFit Theme)
  await prisma.marketingFeature.createMany({
    data: [
      {
        title: "Constantly Varied",
        description: "Prepare for the unknown and unknowable. No two days are the same.",
        iconName: "Shuffle",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "High Intensity",
        description: "Maximize power output with measurable results in short time domains.",
        iconName: "Zap",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Functional Movement",
        description: "Natural, multi-joint movements that transfer to real life.",
        iconName: "Activity",
        sortOrder: 3,
        isActive: true,
      },
    ],
  });

  // 2. Programs (4 items)
  await prisma.marketingProgramPreview.create({
    data: {
      title: "The Competitor",
      slug: "competitor-track",
      description:
        "High-volume programming for athletes aiming for the Open, Quarterfinals, and beyond. Includes double sessions and advanced gymnastics.",
      priceLabel: "$69",
      features: [
        "2 Sessions/Day",
        "Advanced Skills",
        "Swim & Run Intervals",
        "Competition Peaking",
      ],
      isActive: true,
    },
  });

  await prisma.marketingProgramPreview.create({
    data: {
      title: "Performance Rx",
      slug: "performance-rx",
      description:
        "The daily WOD for the dedicated affiliate athlete. Build a huge engine and get strong in 60 minutes a day.",
      priceLabel: "$49",
      features: [
        "60 Min Sessions",
        "Infinite Scaling Options",
        "General Physical Preparedness",
        "Daily Leaderboard",
      ],
      isActive: true,
    },
  });

  await prisma.marketingProgramPreview.create({
    data: {
      title: "Engine Builder",
      slug: "engine-builder",
      description:
        "Dedicated aerobic capacity work. Rowing, running, and biking intervals to increase your VO2 Max.",
      priceLabel: "$29",
      features: [
        "3 Days/Week",
        "Row/Bike/Run Options",
        "Pacing Strategy",
        "Supplement to Main WOD",
      ],
      isActive: true,
    },
  });

  await prisma.marketingProgramPreview.create({
    data: {
      title: "Masters (35+)",
      slug: "masters-track",
      description:
        "Intensity adjusted for longevity. Same stimulus, smarter volume management for the seasoned athlete.",
      priceLabel: "$39",
      features: ["Joint-Friendly Options", "Recovery Protocols", "4 Days/Week", "Strength Bias"],
      isActive: true,
    },
  });

  // 3. Blog Posts (3 items) - Markdown Content
  await prisma.marketingBlogPost.create({
    data: {
      title: "Mastering the Bar Muscle-Up",
      slug: "mastering-bar-muscle-up",
      excerpt:
        "Stop struggling with the chicken wing. We break down the kip, the transition, and the press out for efficient gymnastics.",
      content: `## The Holy Grail of Gymnastics

The BMU is more about hips than pulling strength. Most athletes fail because they pull too early.

### Key Steps:
1. **The Glide Kip:** Generate horizontal momentum.
2. **Hips to Bar:** Think about popping your hips to the bar, not pulling your chest to it.
3. **The Fast Sit-Up:** Aggressively sit up over the bar as soon as your hips are high enough.

*Common Fault:* The Chicken Wing. This happens when you lose momentum and try to muscle through one arm at a time. Scale back to jumping BMUs to fix this.`,
      authorName: "Coach Ben",
      category: "Gymnastics",
      readTime: 6,
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date(),
      coverImage:
        "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1600&q=80",
      tags: ["Gymnastics", "Skills", "Tutorial"],
    },
  });

  await prisma.marketingBlogPost.create({
    data: {
      title: "Pacing Open Workouts",
      slug: "pacing-open-workouts",
      excerpt:
        "The difference between a good score and a great score is often strategy. Learn how to manage your heart rate in high-intensity metcons.",
      content: `## Don't Blow Up

Redlining in the first minute is a rookie mistake. In a 12-minute AMRAP, the workout doesn't start until minute 8.

### Strategy:
* **Break Early:** Don't wait until failure to break your sets.
* **Breathe:** Sync your breath with your movement.
* **Transitions:** Move quickly between movements, but rest *during* the movement breaks.`,
      authorName: "Sarah 'The Engine'",
      category: "Competition",
      readTime: 4,
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date(),
      // ЗАМЕНА: Битая ссылка заменена на рабочую
      coverImage:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
      tags: ["Competition", "Strategy", "Open"],
    },
  });

  await prisma.marketingBlogPost.create({
    data: {
      title: "Olympic Lifting for Metcons",
      slug: "oly-for-metcons",
      excerpt:
        "Cycling a barbell is different than a max effort lift. Learn the touch-and-go mechanics to shave seconds off your Fran time.",
      content: `## Touch and Go Mechanics

Cycling a barbell efficiently requires using the rebound of the plates.

### Tips:
1. Keep the bar close.
2. Catch high to save your legs.
3. Breathe at the top, not the bottom.`,
      authorName: "Coach Dave",
      category: "Weightlifting",
      readTime: 7,
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date(),
      coverImage:
        "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?auto=format&fit=crop&w=1600&q=80",
      tags: ["Weightlifting", "Cycling", "Technique"],
    },
  });

  // 4. Reviews (3 items) with Avatars
  await prisma.marketingReview.createMany({
    data: [
      {
        authorName: "Mat F.",
        authorRole: "Games Athlete",
        authorAvatar:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
        text: "The programming volume is perfect. I hit PRs on my Snatch and Clean & Jerk while improving my 5k run time.",
        rating: 5,
        isActive: true,
        isFeatured: true,
      },
      {
        authorName: "Tia C.",
        authorRole: "Affiliate Owner",
        authorAvatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        text: "Finally, a track that bridges the gap between class workouts and competitor training. My engine has never been better.",
        rating: 5,
        isActive: true,
        isFeatured: true,
      },
      {
        authorName: "Rich F.",
        authorRole: "Masters Athlete",
        authorAvatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        text: "Smart scaling options allowed me to train around an old shoulder injury and still get fit.",
        rating: 5,
        isActive: true,
        isFeatured: true,
      },
    ],
  });

  console.log("✅ CrossFit Seed completed!");
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
