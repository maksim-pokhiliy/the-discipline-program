import { Gender, PrismaClient, type Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (days: number): Date => {
  const d = new Date();

  d.setDate(d.getDate() - days);

  return d;
};

const at = <T>(arr: T[], index: number): T => {
  const item = arr[index];

  if (item === undefined) {
    throw new Error(`Seed error: index ${index} out of bounds (length ${arr.length})`);
  }

  return item;
};

const clearAll = async () => {
  await prisma.workoutLog.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.userBenchmark.deleteMany();
  await prisma.benchmarkDefinition.deleteMany();
  await prisma.coachNote.deleteMany();
  await prisma.coachActionItem.deleteMany();
  await prisma.planEnrollment.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.marketingContactSubmission.deleteMany();
  await prisma.marketingPageSection.deleteMany();
  await prisma.marketingPage.deleteMany();
  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.marketingBlogPost.deleteMany();
  await prisma.marketingReview.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
};

const seedUsers = async (passwordHash: string) => {
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin",
        role: Role.ADMIN,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(90),
      },
    }),
    prisma.user.create({
      data: {
        email: "coach@thedisciplineprogram.com",
        name: "Denys Linetskyi",
        role: Role.COACH,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(60),
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah.mitchell@email.com",
        name: "Sarah Mitchell",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(55),
      },
    }),
    prisma.user.create({
      data: {
        email: "mike.thompson@email.com",
        name: "Mike Thompson",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(48),
      },
    }),
    prisma.user.create({
      data: {
        email: "jenny.park@email.com",
        name: "Jenny Park",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(34),
      },
    }),
    prisma.user.create({
      data: {
        email: "david.rodriguez@email.com",
        name: "David Rodriguez",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(4),
      },
    }),
    prisma.user.create({
      data: {
        email: "lisa.anderson@email.com",
        name: "Lisa Anderson",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(30),
      },
    }),
    prisma.user.create({
      data: {
        email: "tom.bradley@email.com",
        name: "Tom Bradley",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(2),
      },
    }),
    prisma.user.create({
      data: {
        email: "alex.kovac@email.com",
        name: "Alex Kovac",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(40),
      },
    }),
    prisma.user.create({
      data: {
        email: "nina.reyes@email.com",
        name: "Nina Reyes",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(30),
      },
    }),
    prisma.user.create({
      data: {
        email: "chris.walker@email.com",
        name: "Chris Walker",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(1),
      },
    }),
    prisma.user.create({
      data: {
        email: "maria.santos@email.com",
        name: "Maria Santos",
        role: Role.USER,
        password: passwordHash,
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(20),
      },
    }),
  ]);

  console.log("  Users: 12 (1 admin, 1 coach, 10 athletes)");

  return {
    admin: at(users, 0),
    coach: at(users, 1),
    sarah: at(users, 2),
    mike: at(users, 3),
    jenny: at(users, 4),
    david: at(users, 5),
    lisa: at(users, 6),
    tom: at(users, 7),
    alex: at(users, 8),
    nina: at(users, 9),
    chris: at(users, 10),
    maria: at(users, 11),
  };
};

const seedProfiles = async (users: Awaited<ReturnType<typeof seedUsers>>) => {
  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: users.coach.id,
      bio: "CrossFit & Weightlifting coach. Wingate Sport Institute graduate. Adaptive CrossFit specialist. Your DISCIPLINE dictates your SUCCESS.",
      createdAt: daysAgo(60),
    },
  });

  await prisma.athleteProfile.createMany({
    data: [
      { userId: users.sarah.id, gender: Gender.FEMALE, heightCm: 168, weightKg: 63 },
      { userId: users.mike.id, gender: Gender.MALE, heightCm: 183, weightKg: 88 },
      { userId: users.jenny.id, gender: Gender.FEMALE, heightCm: 160, weightKg: 55 },
      { userId: users.david.id, gender: Gender.MALE, heightCm: 178, weightKg: 82 },
      {
        userId: users.lisa.id,
        gender: Gender.FEMALE,
        heightCm: 172,
        weightKg: 67,
        healthStatus: "RESTRICTED",
      },
      { userId: users.tom.id, gender: Gender.MALE, heightCm: 175, weightKg: 78 },
      {
        userId: users.alex.id,
        gender: Gender.MALE,
        heightCm: 190,
        weightKg: 95,
        healthStatus: "INJURED",
      },
      { userId: users.nina.id, gender: Gender.FEMALE, heightCm: 165, weightKg: 58 },
      { userId: users.chris.id, gender: Gender.MALE, heightCm: 180, weightKg: 85 },
      { userId: users.maria.id, gender: Gender.FEMALE, heightCm: 162, weightKg: 56 },
    ],
  });

  console.log("  Profiles: 1 coach, 10 athletes (1 INJURED, 1 RESTRICTED, 8 HEALTHY)");

  return { coachProfile };
};

const seedCoachNotes = async (
  coachProfileId: string,
  users: Awaited<ReturnType<typeof seedUsers>>,
) => {
  await prisma.coachNote.createMany({
    data: [
      {
        coachId: coachProfileId,
        athleteId: users.sarah.id,
        content:
          "Sarah is progressing really well on the Competitor track. Her squat numbers are climbing consistently. Consider adding more volume on Olympic lifts next cycle.",
        createdAt: daysAgo(3),
      },
      {
        coachId: coachProfileId,
        athleteId: users.sarah.id,
        content:
          "Discussed competition goals. She wants to qualify for Quarterfinals this year. Plan is on track.",
        createdAt: daysAgo(1),
      },
      {
        coachId: coachProfileId,
        athleteId: users.mike.id,
        content:
          "Mike is super consistent. Hasn't missed a single day. Strength numbers climbing. Ready for heavier loads next cycle.",
        createdAt: daysAgo(2),
      },
      {
        coachId: coachProfileId,
        athleteId: users.lisa.id,
        content:
          "Lisa reported shoulder pain during overhead work. Set RESTRICTED flag. She should avoid pressing movements until cleared by PT.",
        createdAt: daysAgo(5),
      },
      {
        coachId: coachProfileId,
        athleteId: users.lisa.id,
        content:
          "Spoke with Lisa about modifying her program. Substituting all overhead with landmine press and floor press.",
        createdAt: daysAgo(2),
      },
      {
        coachId: coachProfileId,
        athleteId: users.alex.id,
        content:
          "Alex injured his knee 2 weeks ago. Completely stopped training. Need to check in and discuss rehab plan.",
        createdAt: daysAgo(7),
      },
      {
        coachId: coachProfileId,
        athleteId: users.nina.id,
        content:
          "Nina dropped off 10 days ago with no communication. Sent a check-in message. No reply yet.",
        createdAt: daysAgo(3),
      },
      {
        coachId: coachProfileId,
        athleteId: users.jenny.id,
        content:
          "Jenny crushed it today. Her consistency is paying off. Ready to try ring muscle-ups next week.",
        createdAt: new Date(),
      },
      {
        coachId: coachProfileId,
        athleteId: users.david.id,
        content:
          "New athlete David enrolled 4 days ago. Completed 2 sessions so far. Good movement patterns for a beginner.",
        createdAt: daysAgo(1),
      },
      {
        coachId: coachProfileId,
        athleteId: users.maria.id,
        content:
          "Maria is the most consistent athlete in Performance RX. Zero missed days. Discussing upgrade to Competitor track.",
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log("  Coach notes: 10");
};

const seedBenchmarks = async (users: Awaited<ReturnType<typeof seedUsers>>) => {
  const defs = await Promise.all([
    prisma.benchmarkDefinition.create({
      data: { name: "Back Squat 1RM", unit: "lb", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Deadlift 1RM", unit: "lb", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Clean & Jerk 1RM", unit: "lb", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Snatch 1RM", unit: "lb", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Fran", unit: "seconds", category: "Benchmark WOD" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "2000m Row", unit: "seconds", category: "Cardio" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Max Pull-Ups", unit: "reps", category: "Gymnastics" },
    }),
  ]);

  await prisma.userBenchmark.createMany({
    data: [
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 0).id, value: 225 },
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 1).id, value: 285 },
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 2).id, value: 185 },
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 3).id, value: 145 },
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 4).id, value: 195 },
      { userId: users.sarah.id, benchmarkDefinitionId: at(defs, 6).id, value: 22 },

      { userId: users.mike.id, benchmarkDefinitionId: at(defs, 0).id, value: 315 },
      { userId: users.mike.id, benchmarkDefinitionId: at(defs, 1).id, value: 405 },
      { userId: users.mike.id, benchmarkDefinitionId: at(defs, 2).id, value: 245 },
      { userId: users.mike.id, benchmarkDefinitionId: at(defs, 5).id, value: 420 },
      { userId: users.mike.id, benchmarkDefinitionId: at(defs, 6).id, value: 30 },

      { userId: users.jenny.id, benchmarkDefinitionId: at(defs, 0).id, value: 175 },
      { userId: users.jenny.id, benchmarkDefinitionId: at(defs, 1).id, value: 225 },
      { userId: users.jenny.id, benchmarkDefinitionId: at(defs, 4).id, value: 240 },
      { userId: users.jenny.id, benchmarkDefinitionId: at(defs, 6).id, value: 15 },

      { userId: users.lisa.id, benchmarkDefinitionId: at(defs, 0).id, value: 185 },
      { userId: users.lisa.id, benchmarkDefinitionId: at(defs, 1).id, value: 245 },
      { userId: users.lisa.id, benchmarkDefinitionId: at(defs, 5).id, value: 480 },
    ],
  });

  console.log("  Benchmarks: 7 definitions, 18 athlete records");
};

const seedMarketingPages = async () => {
  const pages = [
    {
      slug: "home",
      title: "Home Page",
      seoTitle: "The Discipline Program — CrossFit Programming for Competitive Athletes",
      seoDesc:
        "High-performance online CrossFit coaching from Ukraine. Structured programming for Open, Quarterfinals, and beyond.",
    },
    {
      slug: "about",
      title: "About Us",
      seoTitle: "About Coach Denys — The Discipline Program",
      seoDesc:
        "CF-L2 certified coach from Ukraine. From Kremenchuk garage gym to online coaching platform.",
    },
    {
      slug: "storefront",
      title: "Programs Storefront",
      seoTitle: "Programs — The Discipline Program",
      seoDesc:
        "Choose your CrossFit programming track: Competitor, Performance RX, or Foundations.",
    },
    {
      slug: "blog",
      title: "The Whiteboard (Blog)",
      seoTitle: "The Whiteboard — CrossFit Training Tips & Insights",
      seoDesc:
        "WOD strategy, Olympic lifting technique, nutrition, and mindset for CrossFit athletes.",
    },
    {
      slug: "contact",
      title: "Contact Us",
      seoTitle: "Contact — The Discipline Program",
      seoDesc: "Questions about programming? Reach out via Telegram or email.",
    },
    {
      slug: "faq",
      title: "FAQ",
      seoTitle: "FAQ — The Discipline Program",
      seoDesc: "Frequently asked questions about training programs, trials, and coaching.",
    },
  ];

  for (const page of pages) {
    await prisma.marketingPage.create({ data: page });
  }

  const sections: { pageSlug: string; section: string; data: unknown }[] = [
    {
      pageSlug: "home",
      section: "hero",
      data: {
        title: "Your DISCIPLINE Dictates Your SUCCESS",
        subtitle:
          "Structured CrossFit programming from Ukraine. For athletes who train with purpose, not randomness.",
        buttonText: "Start Training",
        buttonHref: "/storefront",
        backgroundImage: "/images/coach-hero.jpg",
      },
    },
    {
      pageSlug: "home",
      section: "whyChoose",
      data: {
        title: "Why The Discipline Program?",
        subtitle: "Random workouts give random results. We build systems.",
        features: [
          {
            id: "f1",
            title: "Constantly Varied",
            description: "Periodized programming across all 10 fitness domains. No guesswork.",
            iconName: "Shuffle",
          },
          {
            id: "f2",
            title: "High Intensity",
            description: "Maximize power output with smart programming. Every rep has a purpose.",
            iconName: "Bolt",
          },
          {
            id: "f3",
            title: "Functional Movement",
            description: "Movements that carry over to sport and life. Squat, press, pull, hinge.",
            iconName: "FitnessCenter",
          },
          {
            id: "f4",
            title: "Expert Coaching",
            description:
              "Every session designed by CF-L2 certified coach with competition experience.",
            iconName: "School",
          },
          {
            id: "f5",
            title: "Progress Tracking",
            description:
              "Built-in benchmarks, PR logs, and periodic testing to measure real gains over time.",
            iconName: "TrendingUp",
          },
          {
            id: "f6",
            title: "Community Driven",
            description:
              "Train alongside athletes worldwide. Shared leaderboards, weekly challenges, and accountability.",
            iconName: "Groups",
          },
        ],
      },
    },
    {
      pageSlug: "home",
      section: "storefront",
      data: {
        title: "Choose Your Track",
        subtitle: "From Open preparation to daily GPP. Programming for every level.",
      },
    },
    {
      pageSlug: "home",
      section: "reviews",
      data: {
        title: "Community Results",
        subtitle:
          "Athletes hitting PRs, qualifying for competitions, and getting stronger every day.",
      },
    },
    {
      pageSlug: "home",
      section: "contact",
      data: {
        title: "Join The Community",
        subtitle: "Questions about programming? We are here to help.",
        buttonText: "Get In Touch",
        buttonHref: "/contact",
      },
    },
    {
      pageSlug: "about",
      section: "about:hero",
      data: {
        title: "Coach Denys Linetskyi",
        subtitle:
          "Wingate Institute graduate. CrossFit, Weightlifting & Adaptive CrossFit specialist.",
        buttonText: "Read My Story",
        buttonHref: "#journey",
        backgroundImage: "/images/coach-hero.jpg",
      },
    },
    {
      pageSlug: "about",
      section: "journey",
      data: {
        title: "The Road to Discipline",
        subtitle: "From a garage gym to a coaching platform",
        timeline: [
          {
            year: "2015",
            title: "First WOD",
            description:
              "Discovered CrossFit in Kremenchuk. A rusty barbell, a pull-up bar, and zero quit.",
          },
          {
            year: "2017",
            title: "First Competition",
            description: "Entered a local throwdown. Got humbled. That became the fuel.",
          },
          {
            year: "2019",
            title: "CF-L2 & Coaching",
            description: "Earned Level 2 certification and started coaching at a local affiliate.",
          },
          {
            year: "2022",
            title: "Relocated to Lviv",
            description:
              "War changed everything. Relocated and kept coaching — online and in person.",
          },
          {
            year: "2023",
            title: "The Discipline Program",
            description:
              "Launched the online platform. Bringing structured programming to Ukrainian CrossFit community.",
          },
        ],
      },
    },
    {
      pageSlug: "about",
      section: "credentials",
      data: {
        title: "Certifications",
        subtitle:
          "Internationally recognized qualifications in sport coaching, CrossFit methodology, and adaptive training.",
        items: [
          {
            title: "Wingate Sport Institute",
            description:
              "Diploma in Sport Coaching and Training from Israel's premier sports science institution. Covers exercise physiology, biomechanics, and periodization.",
          },
          {
            title: "CrossFit Level 2 Coach",
            description:
              "Advanced coaching certification focused on programming design, movement correction, and athlete development across all skill levels.",
          },
          {
            title: "Olympic Weightlifting Instructor",
            description:
              "Specialized credential in snatch, clean & jerk technique, and progressive coaching methods for competitive and recreational lifters.",
          },
          {
            title: "Adaptive CrossFit Specialist",
            description:
              "Certified to design inclusive programming for athletes with physical and cognitive disabilities. Scaling, equipment modification, and safety protocols.",
          },
          {
            title: "Sports Nutrition Coach",
            description:
              "Evidence-based nutrition planning for performance athletes. Macro programming, competition fueling strategies, and body composition management.",
          },
          {
            title: "Functional Movement Screen",
            description:
              "FMS certified for injury risk assessment and corrective exercise prescription. Integrated into every athlete onboarding and quarterly reassessment.",
          },
        ],
      },
    },
    {
      pageSlug: "about",
      section: "personal",
      data: {
        title: "Outside The Box",
        subtitle: "The person behind the programming — beyond the whiteboard and the stopwatch.",
        description:
          "When I am not writing training cycles or reviewing athlete videos, you will find me on a trail somewhere in the Carpathian mountains. Long runs above the treeline are my version of active recovery — and honestly, where most of my best programming ideas come from. I am a lifelong student of movement, a relentless meat griller, and a self-taught software engineer who built this entire platform from scratch. I believe coaching is a craft that gets better with obsession, not just experience. Every system in The Discipline Program exists because I was not satisfied with what was already out there.",
        image: "/images/coach-hero.jpg",
        name: "Denys Linetskyi",
        role: "Head Coach & Founder",
      },
    },
    {
      pageSlug: "about",
      section: "cta",
      data: {
        title: "3... 2... 1... GO!",
        subtitle: "The clock is ticking. Your training should not be random.",
        buttonText: "Join The Program",
        buttonHref: "/storefront",
      },
    },
    {
      pageSlug: "storefront",
      section: "storefront:hero",
      data: {
        title: "Programming Tracks",
        subtitle: "Structured paths for every level of CrossFit athlete.",
        backgroundImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      pageSlug: "storefront",
      section: "storefront:cta",
      data: {
        title: "Ready to Train With Purpose?",
        subtitle: "Join 100+ athletes across Ukraine training with The Discipline Program.",
        buttonText: "Start Your Journey",
        buttonHref: "/contact",
      },
    },
    {
      pageSlug: "blog",
      section: "blog:hero",
      data: {
        title: "The Whiteboard",
        subtitle: "WOD strategy, lifting technique, nutrition, and mindset.",
        backgroundImage:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      pageSlug: "contact",
      section: "contact:hero",
      data: { title: "Drop Us A Line", subtitle: "We love talking training." },
    },
    {
      pageSlug: "contact",
      section: "form",
      data: { title: "Get in Touch", subtitle: "Let us know how we can help with your training." },
    },
    {
      pageSlug: "contact",
      section: "directContact",
      data: {
        title: "Contact Info",
        contacts: [
          {
            type: "email",
            label: "Email",
            value: "coach@thedisciplineprogram.com",
            href: "mailto:coach@thedisciplineprogram.com",
          },
          {
            type: "telegram",
            label: "Telegram",
            value: "@thedisciplineprogram",
            href: "https://t.me/thedisciplineprogram",
          },
        ],
      },
    },
    {
      pageSlug: "faq",
      section: "faq:content",
      data: {
        title: "FAQ",
        items: [
          {
            question: "Do I need a gym membership?",
            answer:
              "Yes. You need access to a barbell, plates, pull-up bar, rower, and basic gymnastics equipment.",
          },
          {
            question: "How long are the daily sessions?",
            answer:
              "Foundations: 45 min, Performance RX: 60 min, Competitor: 90-120 min (2 sessions/day).",
          },
          {
            question: "Can I switch between tracks?",
            answer: "Yes, any time. We recommend at least 4 weeks before switching to see results.",
          },
          {
            question: "Is there a free trial?",
            answer: "7-day free trial on all tracks. No credit card required.",
          },
        ],
      },
    },
  ];

  for (const s of sections) {
    await prisma.marketingPageSection.create({
      data: {
        pageSlug: s.pageSlug,
        section: s.section,
        data: s.data as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  console.log("  Pages: 5 with 17 sections");
};

const seedProducts = async () => {
  const products = [
    {
      title: "The Competitor",
      slug: "competitor-track",
      description:
        "High-volume programming for Open/Quarterfinals preparation. Two sessions per day with advanced gymnastics and Olympic lifting.",
      features: [
        "2 Sessions/Day",
        "Advanced Gymnastics",
        "Olympic Lifting Days",
        "Competition Metcons",
        "Video Analysis",
        "Monthly Testing",
      ],
      isFeatured: true,
      isActive: true,
      createdAt: daysAgo(58),
      amountCents: 9900,
    },
    {
      title: "Performance RX",
      slug: "performance-rx",
      description:
        "Daily WOD programming. 60-minute sessions combining strength, skill, and conditioning at full RX standards.",
      features: [
        "60-Min Daily WODs",
        "Full RX Standards",
        "Strength Cycles",
        "Gymnastic Skills",
        "Benchmark Tracking",
      ],
      isActive: true,
      createdAt: daysAgo(58),
      amountCents: 6900,
    },
    {
      title: "Foundations GPP",
      slug: "foundations-gpp",
      description:
        "General Physical Preparedness for new athletes. Scalable workouts with emphasis on movement quality.",
      features: [
        "45-Min Scalable Workouts",
        "Movement Fundamentals",
        "Beginner Progressions",
        "Video Tutorials",
        "Injury Prevention",
      ],
      isActive: true,
      createdAt: daysAgo(55),
      amountCents: 4900,
    },
    {
      title: "Masters 40+",
      slug: "masters-40-plus",
      description:
        "Smart programming for athletes over 40. Joint-friendly variations with modified volume and extended recovery.",
      features: ["4 Days/Week", "Joint-Friendly Variations", "Extended Warm-Up", "Mobility Focus"],
      isActive: false,
      createdAt: daysAgo(52),
      amountCents: 5900,
    },
  ];

  for (const { amountCents, ...data } of products) {
    await prisma.product.create({
      data: { ...data, prices: { create: { amountCents, currency: "USD", interval: "MONTHLY" } } },
    });
  }

  console.log("  Products: 4 (3 active, 1 inactive) with prices");
};

const seedBlogPosts = async () => {
  await prisma.marketingBlogPost.createMany({
    data: [
      {
        slug: "mastering-bar-muscle-up",
        title: "Mastering the Bar Muscle-Up: From Zero to Hero",
        excerpt:
          "Stop struggling with the chicken wing. Complete technical breakdown for athletes stuck at 0-5 reps.",
        content:
          "## The Problem\n\nThe bar muscle-up is the gateway to high-level gymnastics work in CrossFit. Most athletes hit a wall because they treat it as a pull-up with a hip flick.\n\n## Technical Breakdown\n\n### 1. The Kip Swing\nBig global extension to tight arch. Think about pushing the bar away at the back of the swing.\n\n### 2. The Pull Phase\nExplosive hip pop followed by a vertical pull. Your hips drive everything.\n\n### 3. The Transition\nAs you reach peak height, push your hands away from you while leaning your chest over the bar.\n\n### 4. The Dip\nFinish with a strong press. Full lockout at the top.\n\n## 8-Week Progression\n\n- **Weeks 1-2:** Kip swing drills, high pull-ups with chest clearance\n- **Weeks 3-4:** Hollow body holds, explosive chest-to-bar pull-ups\n- **Weeks 5-6:** Banded transitions, negatives from the top\n- **Weeks 7-8:** Volume work, singles and doubles, unbroken sets",
        coverImage:
          "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Training",
        tags: ["gymnastics", "technique", "progressions"],
        readTime: 4,
        isPublished: true,
        isFeatured: true,
        publishedAt: daysAgo(35),
        createdAt: daysAgo(36),
      },
      {
        slug: "pre-workout-nutrition-timing",
        title: "Pre-Workout Nutrition: When and What to Eat Before Training",
        excerpt: "Science-backed meal timing strategies for optimal CrossFit performance.",
        content:
          "## Why Timing Matters\n\nYour body needs 2-3 hours to digest a full meal. Training on a full stomach means blood goes to digestion instead of muscles.\n\n## The 3-Hour Window\n6oz protein + 1 cup carbs + vegetables. This is your main pre-training meal.\n\n## The 30-Minute Snack\nIf you train early: banana + coffee + 10g whey. Simple, fast-digesting.\n\n## Post-Workout\nWithin 60 minutes: 30-40g protein + 40-60g fast carbs. Rice and chicken works. A shake works too.",
        coverImage:
          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Nutrition",
        tags: ["nutrition", "performance", "meal-timing"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(28),
        createdAt: daysAgo(29),
      },
      {
        slug: "mental-game-of-amraps",
        title: "The Mental Game of AMRAPs: Pacing, Pain, and Strategy",
        excerpt: "How to pace, when to push, and the psychological warfare of AMRAP workouts.",
        content:
          "## AMRAPs Are Mind Games\n\n12 minutes. No prescribed rounds. Just you and the clock.\n\n## The Pacing Formula\n- **First third:** 70-75% effort. Establish rhythm. Breathe.\n- **Middle third:** 80-85% effort. Maintain pace. Do not slow down.\n- **Final third:** 90-100% effort. Empty the tank.\n\n## The Break Strategy\nPlan your breaks BEFORE the workout starts. Know exactly where you will rest and for how long.",
        coverImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Mindset",
        tags: ["mental-toughness", "pacing", "amrap"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(21),
        createdAt: daysAgo(22),
      },
      {
        slug: "why-rest-days-matter",
        title: "Why Rest Days Matter More Than Extra Training",
        excerpt:
          "Understanding recovery, adaptation, and why elite athletes program rest strategically.",
        content:
          '## The Biggest Mistake\n\n"I\'ll just do an active recovery WOD." No. Rest means rest.\n\n## The Science of Supercompensation\n1. Training stimulus breaks you down\n2. Fatigue accumulates\n3. Recovery rebuilds you\n4. Supercompensation makes you stronger than before\n\nSkip step 3 and you never reach step 4. That is called overtraining.',
        coverImage:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Fitness",
        tags: ["recovery", "programming", "rest-days"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(14),
        createdAt: daysAgo(15),
      },
      {
        slug: "mobility-vs-flexibility",
        title: "Mobility vs. Flexibility: What CrossFit Athletes Actually Need",
        excerpt:
          "Why being flexible does not mean you are mobile, and why it matters for your snatch.",
        content:
          "## Flexibility: Passive Range\nHow far a joint moves with external force. Sitting in a split is flexibility.\n\n## Mobility: Active Control\nHow far a joint moves under your own power, under load. Holding an overhead squat is mobility.\n\n## The 15-Minute Daily Routine\n1. Deep squat hold (2 min)\n2. PVC pass-throughs (20 reps)\n3. Active leg raises (10 each)\n4. Thoracic rotations (10 each side)\n5. Ankle dorsiflexion (2 min each)",
        coverImage:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Recovery",
        tags: ["mobility", "flexibility", "injury-prevention"],
        readTime: 5,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(7),
        createdAt: daysAgo(8),
      },
      {
        slug: "olympic-lifting-cues-that-work",
        title: "5 Olympic Lifting Cues That Actually Work",
        excerpt: "Simple coaching cues that fix snatch and clean technique on the spot.",
        content:
          '## Cue 1: "Push The Floor Away"\nInstead of pulling the bar up, push your feet through the floor. Changes everything off the ground.\n\n## Cue 2: "Patience Off The Floor"\nDo not rush the first pull. Stay over the bar longer.\n\n## Cue 3: "Elbows High and Outside"\nKeeps the bar close during the turnover. Works for both clean and snatch.\n\n## Cue 4: "Meet The Bar"\nPull yourself under actively. Do not wait for the bar to crash on you.\n\n## Cue 5: "Punch To The Ceiling"\nAggressive lockout overhead. Fast elbows, fast feet.',
        coverImage:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Training",
        tags: ["olympic-lifting", "technique", "coaching-cues"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(42),
        createdAt: daysAgo(43),
      },
      {
        slug: "open-preparation-timeline",
        title: "12-Week Open Preparation Timeline",
        excerpt: "Strategic programming phases to peak for the CrossFit Open.",
        content:
          "## The Framework\n\nPeaking for the Open requires periodized programming. You cannot go hard 52 weeks a year.\n\n## Phase 1: Volume (Weeks 12-9)\nBuild work capacity. High volume, moderate intensity.\n\n## Phase 2: Intensity (Weeks 8-5)\nReduce volume, increase intensity. Test benchmark WODs.\n\n## Phase 3: Taper (Weeks 4-1)\nSharp, short workouts. Practice Open-style formats.\n\n[Full program details coming soon]",
        coverImage: null,
        authorName: "Coach Denys",
        category: "Training",
        tags: ["open", "competition", "periodization"],
        readTime: null,
        isPublished: false,
        isFeatured: false,
        publishedAt: null,
        createdAt: daysAgo(3),
      },
      {
        slug: "protein-for-crossfit-athletes",
        title: "How Much Protein Do CrossFit Athletes Really Need?",
        excerpt: "Evidence-based protein intake recommendations for functional fitness athletes.",
        content:
          "## The Short Answer\n\n**1.6-2.2 grams per kilogram of bodyweight per day.**\n\nFor a 80kg male athlete: 128-176g protein daily.\nFor a 60kg female athlete: 96-132g protein daily.\n\n## Protein Timing\nTotal daily intake matters more than timing. But spreading it across 4 meals helps.\n\n## Best Sources\nChicken breast (31g/100g), salmon (25g/100g), lean beef (26g/100g), eggs (6g each), Greek yogurt (10g/100g).",
        coverImage:
          "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Denys",
        category: "Nutrition",
        tags: ["protein", "nutrition", "macros"],
        readTime: 5,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(49),
        createdAt: daysAgo(50),
      },
    ],
  });

  console.log("  Blog posts: 8 (7 published, 1 draft, 1 featured)");
};

const seedReviews = async () => {
  await prisma.marketingReview.createMany({
    data: [
      {
        authorName: "Sarah Mitchell",
        authorRole: "Competitor Track Athlete",
        text: "6 months on The Competitor track. PRed my clean & jerk by 15 lb, went from 5 bar muscle-ups to 25 unbroken, and qualified for Quarterfinals. The programming is legit.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(38),
      },
      {
        authorName: "Mike Thompson",
        authorRole: "Performance RX Member",
        text: "Best daily WOD programming I have ever followed. The strength cycles are smart, the metcons are brutal, and I hit a 20 lb PR on my back squat in 3 months.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(31),
      },
      {
        authorName: "Jennifer Park",
        authorRole: "Garage Gym Athlete",
        text: "After my local box closed, I thought competitive CrossFit was over for me. Foundations GPP gave me the structure I needed for solo training. Now I am fitter than when I had a coach in person.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(25),
      },
      {
        authorName: "David Rodriguez",
        authorRole: "Comeback Athlete",
        text: "Took 2 years off. Coming back at 38 was humbling. Foundations has been perfect for rebuilding my base. Already stringing together double unders again.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(19),
      },
      {
        authorName: "Emma Lawson",
        authorRole: "Open Competitor",
        text: "The Competitor track is absolutely brutal in the best way. Finished top 500 worldwide in the Open this year. The EMOM and AMRAP programming is next level.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(16),
      },
      {
        authorName: "Lisa Anderson",
        authorRole: "Masters 45-49",
        text: "My joints feel better than 5 years ago and I am lifting heavier. The mobility work built into every session makes a huge difference.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(12),
      },
      {
        authorName: "Tom Bradley",
        authorRole: "Weekend Warrior",
        text: "Great programming for someone who trains 4 days a week. Got my first muscle-up and deadlift went from 315 to 365 in 3 months.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(8),
      },
      {
        authorName: "Rachel Kim",
        authorRole: "Box Owner",
        text: "I use The Discipline Program for my gym's competition team. The periodization is solid, the volume is right, and my athletes are peaking when it matters. Saved me hours of programming every week.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(5),
      },
      {
        authorName: "James O'Brien",
        authorRole: "Military Athlete",
        text: "Need to stay combat-ready and this delivers. The GPP base building is exactly what tactical athletes need. Ruck performance is up, recovery time is down.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(3),
      },
      {
        authorName: "Anonymous",
        authorRole: null,
        text: "Decent programming but pacing was too slow for my level. Switched after 2 months.",
        rating: 3,
        isActive: false,
        createdAt: daysAgo(45),
      },
    ],
  });

  console.log("  Reviews: 10 (9 active, 1 inactive)");
};

const seedContactSubmissions = async () => {
  await prisma.marketingContactSubmission.createMany({
    data: [
      {
        name: "Oleksandr Shevchenko",
        email: "oleksandr.s@email.com",
        program: "The Competitor",
        message:
          "Training for the Open. How does The Competitor track compare to competitive affiliate programming?",
        status: "NEW",
        createdAt: daysAgo(1),
      },
      {
        name: "Rachel Martinez",
        email: "rachel.m@email.com",
        program: "Foundations GPP",
        message:
          "I have a garage gym with barbell, plates, pull-up bar, and rings. Will Foundations work for my setup?",
        status: "NEW",
        createdAt: daysAgo(2),
      },
      {
        name: "Iryna Bondarenko",
        email: "iryna.b@email.com",
        program: "Masters 40+",
        message:
          "I am 52. When is the Masters 40+ program coming back? My knees need the joint-friendly approach.",
        status: "NEW",
        createdAt: daysAgo(4),
      },
      {
        name: "Mark Sullivan",
        email: "mark.sullivan@email.com",
        message:
          "Do you offer annual discounts? Looking to commit for a full year of Performance RX.",
        status: "IN_PROGRESS",
        notes: "Sent annual pricing. Waiting for reply.",
        createdAt: daysAgo(5),
      },
      {
        name: "Sophie Williams",
        email: "sophie.w@email.com",
        program: "Performance RX",
        message: "Signed up yesterday but the training section shows no WODs. Is this normal?",
        status: "IN_PROGRESS",
        notes: "Subscription sync issue. Escalated to dev.",
        createdAt: daysAgo(3),
      },
      {
        name: "Dmytro Koval",
        email: "dmytro.k@email.com",
        program: "Foundations GPP",
        message:
          "6 weeks into Foundations. When should I move up to Performance RX? I can do 10 pull-ups and my Fran is under 6 minutes.",
        status: "REPLIED",
        notes: "Ready for RX. Sent transition guide.",
        createdAt: daysAgo(11),
      },
      {
        name: "Christina Lee",
        email: "christina.lee@email.com",
        program: "Performance RX",
        message:
          "Dealing with rotator cuff tendinitis. Are there built-in substitutions for overhead work?",
        status: "REPLIED",
        notes: "Advised PT first. Sent overhead substitutions list.",
        createdAt: daysAgo(15),
      },
      {
        name: "Jason Miller",
        email: "jason.m@email.com",
        program: "The Competitor",
        message:
          "Hit a 20 lb PR on back squat and qualified for Quarterfinals. Just wanted to say thanks!",
        status: "CLOSED",
        notes: "Success story. Asked for review.",
        createdAt: daysAgo(18),
      },
      {
        name: "Andrii Lysenko",
        email: "andrii@crossfitlviv.com",
        message:
          "I run a CrossFit affiliate in Lviv. Interested in bulk licensing for our members.",
        status: "CLOSED",
        notes: "Not ready for affiliate licensing yet. Added to waitlist.",
        createdAt: daysAgo(14),
      },
      {
        name: "Nicole Anderson",
        email: "nicole.a@email.com",
        program: "Foundations GPP",
        message: "Do you have a mobile app? I train at a gym without good WiFi.",
        status: "CLOSED",
        notes: "PWA in development. Works offline once loaded.",
        createdAt: daysAgo(20),
      },
    ],
  });

  console.log("  Contacts: 10 (3 NEW, 2 IN_PROGRESS, 2 REPLIED, 3 CLOSED)");
};

const main = async () => {
  console.log("Starting seed...\n");

  await clearAll();

  const passwordHash = await bcrypt.hash("password123", 12);

  const users = await seedUsers(passwordHash);
  const { coachProfile } = await seedProfiles(users);

  await seedCoachNotes(coachProfile.id, users);
  await seedBenchmarks(users);

  await seedMarketingPages();
  await seedProducts();
  await seedBlogPosts();
  await seedReviews();
  await seedContactSubmissions();

  console.log("\nSeed completed!");
  console.log("  Admin:   admin@example.com / password123");
  console.log("  Coach:   coach@thedisciplineprogram.com / password123");
  console.log("  Athlete: sarah.mitchell@email.com / password123");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
