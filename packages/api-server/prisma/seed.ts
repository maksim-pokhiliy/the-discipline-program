import { PrismaClient, type Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (days: number): Date => {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;
};

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

const clearAll = async () => {
  await prisma.setLog.deleteMany();
  await prisma.prescribedSet.deleteMany();
  await prisma.workoutBlock.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.exerciseCategory.deleteMany();
  await prisma.marketingContactSubmission.deleteMany();
  await prisma.marketingPageSection.deleteMany();
  await prisma.marketingPage.deleteMany();
  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.marketingBlogPost.deleteMany();
  await prisma.marketingReview.deleteMany();
  await prisma.user.deleteMany();
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const seedUsers = async (passwordHash: string) => {
  await prisma.user.createMany({
    data: [
      {
        email: "admin@example.com",
        role: Role.ADMIN,
        password: passwordHash,
        createdAt: daysAgo(90),
      },
      {
        email: "coach.ben@thedisciplineprogram.com",
        role: Role.COACH,
        password: passwordHash,
        createdAt: daysAgo(60),
      },
      {
        email: "sarah.mitchell@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(55),
      },
      {
        email: "mike.thompson@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(48),
      },
      {
        email: "jenny.park@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(34),
      },
      {
        email: "david.rodriguez@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(28),
      },
      {
        email: "lisa.anderson@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(12),
      },
      {
        email: "tom.bradley@email.com",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(5),
      },
    ],
  });

  console.log("  Users: 8 (1 admin, 1 coach, 6 regular)");
};

// ---------------------------------------------------------------------------
// Exercise Categories & Exercises
// ---------------------------------------------------------------------------

const seedExerciseCategories = async () => {
  const categories: Prisma.ExerciseCategoryCreateManyInput[] = [
    { name: "Strength", sortOrder: 0 },
    { name: "Metcon", sortOrder: 1 },
    { name: "Cardio", sortOrder: 2 },
    { name: "Accessory", sortOrder: 3 },
    { name: "Warmup", sortOrder: 4 },
    { name: "Skill", sortOrder: 5 },
  ];

  await prisma.exerciseCategory.createMany({ data: categories });

  console.log("  Exercise categories: 6");
};

const seedExercises = async () => {
  const categories = await prisma.exerciseCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const exercises: Prisma.ExerciseCreateManyInput[] = [
    { name: "Back Squat", categoryId: categoryMap.get("Strength"), createdAt: daysAgo(30) },
    { name: "Deadlift", categoryId: categoryMap.get("Strength"), createdAt: daysAgo(30) },
    { name: "Bench Press", categoryId: categoryMap.get("Strength"), createdAt: daysAgo(30) },
    { name: "Overhead Press", categoryId: categoryMap.get("Strength"), createdAt: daysAgo(29) },
    { name: "Front Squat", categoryId: categoryMap.get("Strength"), createdAt: daysAgo(29) },
    { name: "Clean & Jerk", categoryId: categoryMap.get("Skill"), createdAt: daysAgo(28) },
    { name: "Snatch", categoryId: categoryMap.get("Skill"), createdAt: daysAgo(28) },
    { name: "Bar Muscle-Up", categoryId: categoryMap.get("Skill"), createdAt: daysAgo(27) },
    { name: "Ring Muscle-Up", categoryId: categoryMap.get("Skill"), createdAt: daysAgo(27) },
    { name: "Handstand Walk", categoryId: categoryMap.get("Skill"), createdAt: daysAgo(26) },
    { name: "Burpee", categoryId: categoryMap.get("Metcon"), createdAt: daysAgo(25) },
    { name: "Wall Ball", categoryId: categoryMap.get("Metcon"), createdAt: daysAgo(25) },
    { name: "Box Jump", categoryId: categoryMap.get("Metcon"), createdAt: daysAgo(25) },
    { name: "Kettlebell Swing", categoryId: categoryMap.get("Metcon"), createdAt: daysAgo(24) },
    { name: "Rowing", categoryId: categoryMap.get("Cardio"), createdAt: daysAgo(24) },
    { name: "Assault Bike", categoryId: categoryMap.get("Cardio"), createdAt: daysAgo(24) },
    { name: "Running", categoryId: categoryMap.get("Cardio"), createdAt: daysAgo(23) },
    { name: "Jump Rope", categoryId: categoryMap.get("Cardio"), createdAt: daysAgo(23) },
    { name: "Tricep Pushdown", categoryId: categoryMap.get("Accessory"), createdAt: daysAgo(22) },
    { name: "Lateral Raise", categoryId: categoryMap.get("Accessory"), createdAt: daysAgo(22) },
    { name: "GHD Sit-Up", categoryId: categoryMap.get("Accessory"), createdAt: daysAgo(21) },
    { name: "PVC Pass-Through", categoryId: categoryMap.get("Warmup"), createdAt: daysAgo(21) },
    { name: "Arm Circles", categoryId: categoryMap.get("Warmup"), createdAt: daysAgo(20) },
    { name: "Jumping Jacks", categoryId: categoryMap.get("Warmup"), createdAt: daysAgo(20) },
  ];

  await prisma.exercise.createMany({ data: exercises });

  console.log("  Exercises: 24");
};

// ---------------------------------------------------------------------------
// Marketing Pages & Sections
// ---------------------------------------------------------------------------

const seedMarketingPages = async () => {
  const pages = [
    {
      slug: "home",
      title: "Home Page",
      seoTitle: "The Discipline Program — Forging Elite Fitness",
      seoDesc:
        "High-performance coaching platform for CrossFit athletes. Structured programming for competitors, RX athletes, and beginners.",
    },
    {
      slug: "about",
      title: "About Us",
      seoTitle: "About — The Discipline Program",
      seoDesc:
        "Meet Coach Ben. 10 years of coaching experience, Games athlete mindset, and a passion for building elite athletes.",
    },
    {
      slug: "storefront",
      title: "Programs Storefront",
      seoTitle: "Programs — The Discipline Program",
      seoDesc:
        "Choose your training track: Competitor, Performance RX, or Foundations. Structured CrossFit programming for every level.",
    },
    {
      slug: "blog",
      title: "The Whiteboard (Blog)",
      seoTitle: "The Whiteboard — Training Tips & Insights",
      seoDesc:
        "WOD tips, movement standards, nutrition advice, and mindset training from Coach Ben and the Discipline community.",
    },
    {
      slug: "contact",
      title: "Contact Us",
      seoTitle: "Contact — The Discipline Program",
      seoDesc:
        "Questions about programming, equipment, or pricing? Get in touch with the Discipline team.",
    },
  ];

  for (const page of pages) {
    await prisma.marketingPage.create({ data: page });
  }

  // --- Home Page Sections ---

  const homeSections = [
    {
      section: "hero",
      data: {
        title: "Forging Elite Discipline",
        subtitle: "Functional fitness for those who refuse to settle.",
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
        subtitle: "Random workouts give random results.",
        features: [
          {
            id: "f1",
            title: "Constantly Varied",
            description:
              "Prepare for the unknown and unknowable. Every cycle is different, every session purposeful.",
            iconName: "Shuffle",
          },
          {
            id: "f2",
            title: "High Intensity",
            description:
              "Maximize power output. Our programming is designed to push you beyond your comfort zone safely.",
            iconName: "Bolt",
          },
          {
            id: "f3",
            title: "Functional Movement",
            description:
              "Transfer to real life. Movements that build strength you can actually use.",
            iconName: "FitnessCenter",
          },
          {
            id: "f4",
            title: "Expert Coaching",
            description:
              "Every session designed by a certified coach with 10+ years of competitive experience.",
            iconName: "School",
          },
        ],
      },
    },
    {
      section: "storefront",
      data: {
        title: "Choose Your Track",
        subtitle: "From Open preparation to daily GPP. Programming for every level and every goal.",
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
        subtitle: "Questions about scaling or equipment? We're here to help.",
        buttonText: "Get In Touch",
        buttonHref: "/contact",
      },
    },
  ];

  for (const s of homeSections) {
    await prisma.marketingPageSection.create({
      data: { pageSlug: "home", section: s.section, data: s.data, isActive: true },
    });
  }

  // --- About Page Sections ---

  const aboutSections = [
    {
      section: "about:hero",
      data: {
        title: "Head Coach",
        subtitle: "10 years in the affiliate community. Games athlete mindset.",
        buttonText: "Learn My Story",
        buttonHref: "#journey",
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
            description:
              "Started with a rusty barbell and a dream. First taste of CrossFit in a friend's garage gym.",
          },
          {
            year: "2015",
            title: "First Competition",
            description:
              "Entered a local throwdown and got destroyed. That feeling of falling short became the fuel.",
          },
          {
            year: "2016",
            title: "First Certification",
            description:
              "Earned my L1 and started coaching local athletes. Found my calling on the whiteboard, not just under the barbell.",
          },
          {
            year: "2019",
            title: "Regionals",
            description:
              "Qualified for Regionals as an individual athlete. Proved that disciplined programming beats random WODs.",
          },
          {
            year: "2023",
            title: "The Discipline Program",
            description:
              "Launched the online platform to reach more athletes. Same methodology, no geographic limits.",
          },
        ],
      },
    },
    {
      section: "credentials",
      data: {
        title: "Certifications",
        items: [
          {
            title: "CrossFit Level 3 (CCFT)",
            description:
              "Certified CrossFit Trainer — the highest individual credential in the methodology.",
          },
          {
            title: "USA Weightlifting Level 1",
            description:
              "Sports Performance Coach with focus on snatch and clean & jerk technique.",
          },
          {
            title: "Burgener Strength",
            description: "Weightlifting Staff certification under Mike Burgener's program.",
          },
          {
            title: "Precision Nutrition L1",
            description: "Evidence-based nutrition coaching for performance athletes.",
          },
        ],
      },
    },
    {
      section: "personal",
      data: {
        title: "Outside The Box",
        description:
          "When I'm not coaching the snatch or analyzing WOD times, I'm trail running in the mountains or grilling huge amounts of protein for the week ahead. I believe fitness should enhance your life, not consume it.",
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

  // --- Storefront Page Sections ---

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "storefront",
      section: "storefront:hero",
      data: {
        title: "Programming Tracks",
        subtitle: "Structured paths for Competitors and Everyday Athletes.",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "storefront",
      section: "storefront:cta",
      data: {
        title: "Ready to Transform Your Fitness?",
        subtitle:
          "Join 100+ athletes who have already started their transformation journey. Your discipline determines your success.",
        buttonText: "Start Your Journey",
        buttonHref: "/contact",
      },
      isActive: true,
    },
  });

  // --- Blog Page Section ---

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "blog",
      section: "blog:hero",
      data: {
        title: "The Whiteboard",
        subtitle: "WOD tips, movement standards, and nutrition advice.",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
      isActive: true,
    },
  });

  // --- Contact Page Sections ---

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "contact:hero",
      data: {
        title: "Drop Us A Line",
        subtitle:
          "We love talking shop. Whether you're a seasoned competitor or just starting out, we're here to help.",
      },
      isActive: true,
    },
  });

  await prisma.marketingPageSection.create({
    data: {
      pageSlug: "contact",
      section: "form",
      data: {
        title: "Get in Touch",
        subtitle: "Feedback on programming? Questions about getting started? Let us know.",
      },
      isActive: true,
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
          {
            type: "telegram",
            label: "Telegram",
            value: "@disciplineprogram",
            href: "https://t.me/disciplineprogram",
          },
        ],
        workingHours: "Mon-Fri: 6am - 8pm\nSat: 8am - 12pm\nSun: Rest Day",
      },
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
              "Yes, you'll need access to a barbell, plates, pull-up bar, and ideally some conditioning equipment (rower, bike, or jump rope). A CrossFit affiliate or well-equipped garage gym works perfectly.",
          },
          {
            question: "How long are the daily sessions?",
            answer:
              "Depending on your track: Foundations sessions run about 45 minutes, Performance RX is 60 minutes, and The Competitor has two sessions totaling about 90-120 minutes per day.",
          },
          {
            question: "Can I switch between tracks?",
            answer:
              "Absolutely. You can change your track at any time. We recommend finishing at least 4 weeks on one track before switching to get a fair sense of the programming.",
          },
          {
            question: "Is there a free trial?",
            answer:
              "We offer a 7-day free trial on all tracks so you can experience the programming before committing. No credit card required to start.",
          },
        ],
      },
      isActive: true,
    },
  });

  console.log("  Pages: 5 with 16 sections");
};

// ---------------------------------------------------------------------------
// Storefront Programs
// ---------------------------------------------------------------------------

const seedProducts = async () => {
  const products = [
    {
      title: "The Competitor",
      slug: "competitor-track",
      description:
        "High-volume programming designed for athletes preparing for the Open, Quarterfinals, or local throwdowns. Two sessions per day with sport-specific skill work, heavy lifting, and advanced conditioning. For athletes who have mastered the basics and are ready to test themselves against the best.",
      features: [
        "2 Sessions/Day (Morning + Evening)",
        "Advanced Gymnastics Progressions",
        "Dedicated Olympic Lifting Days",
        "Competition-Specific Metcons",
        "Video Movement Analysis",
        "Monthly Performance Testing",
      ],
      isActive: true,
      createdAt: daysAgo(58),
      amountCents: 9900,
    },
    {
      title: "Performance RX",
      slug: "performance-rx",
      description:
        "Daily WOD programming for dedicated athletes who want to perform movements as prescribed. 60-minute sessions combining strength work, skill development, and metabolic conditioning. Perfect for experienced CrossFitters looking to maintain and improve their fitness year-round.",
      features: [
        "60-Min Daily WODs",
        "Full RX Movement Standards",
        "Progressive Strength Cycles",
        "Gymnastic Skill Sessions",
        "Benchmark WOD Tracking",
      ],
      isActive: true,
      createdAt: daysAgo(58),
      amountCents: 6900,
    },
    {
      title: "Foundations GPP",
      slug: "foundations-gpp",
      description:
        "General Physical Preparedness for athletes new to CrossFit or returning after time away. Emphasis on movement quality, building strength, and developing aerobic capacity. Scalable workouts with detailed coaching cues and video demonstrations for every movement.",
      features: [
        "45-Min Scalable Workouts",
        "Movement Fundamentals Focus",
        "Beginner-Friendly Progressions",
        "Detailed Video Tutorials",
        "Injury Prevention Emphasis",
      ],
      isActive: true,
      createdAt: daysAgo(55),
      amountCents: 4900,
    },
    {
      title: "Masters 40+",
      slug: "masters-40-plus",
      description:
        "Strength and conditioning designed for athletes over 40. Smart programming that respects recovery needs while building sustainable fitness. Modified movements and volume to match the unique demands of the Masters division.",
      features: [
        "4 Days/Week Programming",
        "Joint-Friendly Movement Variations",
        "Extended Warm-Up Protocols",
        "Mobility & Recovery Focus",
      ],
      isActive: false,
      createdAt: daysAgo(52),
      amountCents: 5900,
    },
  ];

  for (const { amountCents, ...productData } of products) {
    await prisma.product.create({
      data: {
        ...productData,
        prices: {
          create: {
            amountCents,
            currency: "USD",
            interval: "MONTHLY",
          },
        },
      },
    });
  }

  console.log("  Products: 4 (3 active, 1 inactive) with prices");
};

// ---------------------------------------------------------------------------
// Blog Posts
// ---------------------------------------------------------------------------

const seedBlogPosts = async () => {
  await prisma.marketingBlogPost.createMany({
    data: [
      // --- Post 1: Featured (Training) ---
      {
        slug: "mastering-bar-muscle-up",
        title: "Mastering the Bar Muscle-Up: From Zero to Hero",
        excerpt:
          "Stop struggling with the chicken wing and start owning this movement. A complete technical breakdown for athletes stuck at 0-5 reps.",
        content: `## The Problem

The bar muscle-up is the gateway to high-level gymnastics work in CrossFit. But most athletes approach it wrong — trying to muscle their way through instead of understanding the mechanics.

If you can do 10+ chest-to-bar pull-ups and 10+ ring dips, you have the strength. What you're missing is technique.

## Technical Breakdown

### 1. The Pull Phase

Your pull must be explosive and vertical. Think "chest to bar" on steroids. The goal is maximum height with your chest clearing the bar by several inches. This is not a kipping pull-up — it's a completely different movement pattern.

**Key cue:** "Pull the bar to your hips, not your chin."

### 2. The Transition

This is where most athletes fail. As you reach peak height, aggressively push your hands away from your body while leaning forward over the bar. Your elbows should travel backward and around the bar — never flaring outward (the dreaded chicken wing).

**Key cue:** "Sit up fast — like you're getting out of bed late."

### 3. The Dip

Once your hips are against the bar and your torso is upright, finish with a strong press. This should feel identical to a straight bar dip. Lock out fully at the top.

## 8-Week Progression

- **Weeks 1-2:** High pull-ups with chest clearance focus. 5 sets of 3 reps with maximal explosion.
- **Weeks 3-4:** Hollow body drills + explosive chest-to-bar work. Build the body position that enables the transition.
- **Weeks 5-6:** Banded bar muscle-up transitions. Focus on the lean-over, not the pull.
- **Weeks 7-8:** Volume work. Singles and doubles, accumulating to 15-20 total reps per session.

## Common Mistakes

- Not pulling high enough before initiating the transition
- Trying to muscle through with arm strength alone
- Letting elbows flare sideways instead of traveling backward
- Losing hollow body position during the kip

Master these principles and you'll add 5-10 reps to your capacity in 8 weeks. The bar muscle-up is a skill, not a strength movement — treat it like one.`,
        coverImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Training",
        tags: ["gymnastics", "technique", "progressions"],
        readTime: 4,
        isPublished: true,
        isFeatured: true,
        publishedAt: daysAgo(35),
        createdAt: daysAgo(36),
      },

      // --- Post 2: Nutrition ---
      {
        slug: "pre-workout-nutrition-timing",
        title: "Pre-Workout Nutrition: When and What to Eat Before Training",
        excerpt:
          "Optimize your training performance with science-backed meal timing strategies. Stop guessing and start fueling properly.",
        content: `## Why Timing Matters

Your body needs 2-3 hours to digest a full meal. Train too soon after eating and you'll feel sluggish with food sitting in your stomach. Train fully fasted and you might bonk mid-WOD when you need energy the most.

The solution? Strategic fueling based on your training schedule.

## The 3-Hour Window: Full Meal

**Best for:** Morning WODs after breakfast, evening training after lunch.

**Example meal:**
- 6oz grilled chicken or salmon
- 1 cup sweet potato or rice
- Mixed vegetables
- Small side of avocado or olive oil

**Macro target:** ~40g protein / ~50g carbs / ~15g fat

This gives your body plenty of time to digest and convert food into usable energy. You'll feel fueled but not heavy.

## The 60-90 Minute Window: Light Snack

**Best for:** Lunch-hour WODs, training between meals.

**Example snacks:**
- Banana with 1 tbsp almond butter
- Rice cakes with honey
- Greek yogurt with berries
- Small smoothie (banana, protein powder, oats)

**Focus:** Fast-digesting carbs with minimal fat. Fat slows digestion — save it for post-workout.

## The 15-30 Minute Window: Emergency Fuel

**Best for:** Early AM training when you can't eat hours before, or unexpected session invites.

**Quick options:**
- 2-3 Medjool dates
- Applesauce pouch
- Sports drink (20-30g carbs)
- Half a banana

**The rule:** If you can't eat 2+ hours before, go very light. Something is better than nothing, but too much will backfire.

## Post-Workout: The Recovery Window

Within 60 minutes after training:
- 30-40g protein (shake, chicken, eggs)
- 40-60g fast carbs (rice, potatoes, fruit)
- Rehydrate with water + electrolytes

## The Bottom Line

Consistency beats perfection. Find what works for YOUR body through experimentation — everyone's gut is different. Once you find your formula, stick with it. Your performance will thank you.`,
        coverImage:
          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Nutrition",
        tags: ["nutrition", "performance", "meal-timing"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(28),
        createdAt: daysAgo(29),
      },

      // --- Post 3: Mindset ---
      {
        slug: "mental-game-of-amraps",
        title: "The Mental Game of AMRAPs: Pacing, Pain, and Strategy",
        excerpt:
          "How to pace, when to push, and the psychological warfare of 'as many rounds as possible' workouts.",
        content: `## AMRAPs Are Mind Games

12 minutes. No prescribed rounds. No finish line. Just you, the clock, and your willingness to suffer.

AMRAPs (As Many Rounds As Possible) are unique in CrossFit because there's no "done." The workout doesn't end when you finish the work — it ends when the clock runs out. This means the limiting factor isn't your body. It's your brain.

## The Opening Sprint Trap

Every athlete has done this: the clock starts, adrenaline kicks in, and you blast through the first two rounds like it's a sprint. Round one feels easy. Round two is still good. Round three... the wheels come off. By round five, you're staring at the barbell wondering why you signed up for this.

**The fix:** Aim for negative splits. Your last round should be your fastest, not your first.

## The Pacing Formula

Break the time cap into thirds:

- **First third (0-33%):** 70-75% effort. Establish your rhythm, focus on movement quality, keep your heart rate manageable.
- **Middle third (33-66%):** 80-85% effort. Settle into controlled discomfort. This is where you make up time through efficiency, not speed.
- **Final third (66-100%):** 90-100% effort. Empty the tank. This is where your mental toughness earns you extra rounds.

For a 12-minute AMRAP, that's 4 minutes easy, 4 minutes steady, 4 minutes all-out.

## Mental Checkpoints

Don't think about the whole workout. Set micro-goals:

- "Just finish this round, then reassess"
- "Beat my score from last time by one round"
- "Stay within 5 seconds of my target round time"
- "Don't put the barbell down until the set is complete"

Breaking a long AMRAP into 2-3 minute chunks makes 12 or 20 minutes manageable.

## The Final 60 Seconds

This is where champions are made. When your lungs are burning and your legs are screaming, your mind has two choices: slow down or dig deeper.

Count the seconds. Make every rep deliberate. Don't coast to the finish — attack it.

The pain is temporary. Your score is permanent.`,
        coverImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Mindset",
        tags: ["mental-toughness", "pacing", "amrap", "strategy"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(21),
        createdAt: daysAgo(22),
      },

      // --- Post 4: Fitness ---
      {
        slug: "why-rest-days-matter",
        title: "Why Rest Days Matter More Than Extra Training",
        excerpt:
          "More is not always better. Understanding recovery, adaptation, and why elite athletes program rest strategically.",
        content: `## The Biggest Mistake Intermediate Athletes Make

"I'll just do an active recovery WOD on my rest day."

No. Rest means rest. If you're doing burpees, it's not a rest day.

This might be the hardest concept in CrossFit: sometimes doing less makes you stronger. But the science is unambiguous.

## The Science of Supercompensation

Training doesn't make you stronger. Recovery does. Here's the cycle:

1. **Training stimulus** — you break down muscle fibers and stress your central nervous system
2. **Fatigue** — immediately after training, you're weaker than before
3. **Recovery** — your body repairs the damage over 24-72 hours
4. **Supercompensation** — if you rest enough, you rebuild stronger than your baseline

You only get step 4 if you actually rest. Skip recovery and you accumulate fatigue without the adaptation. That's called overtraining, and it leads to plateaus, injuries, and burnout.

## What a Real Rest Day Looks Like

**DO:**
- Light walking (20-30 minutes, easy pace)
- Gentle stretching or yoga (nothing intense)
- Mobility work (15 minutes with a foam roller or lacrosse ball)
- Eat well — your body needs fuel to rebuild
- Sleep 8+ hours — this is when growth hormone peaks

**DON'T:**
- "Light metcon" — it's still a metcon
- Running 5K — that's cardio training
- Heavy lifting — even "just a few sets"
- Any workout that raises your heart rate above 120 BPM

## The Optimal Training Split

For most CrossFit athletes, the sweet spot is:

- **Monday:** Training
- **Tuesday:** Training
- **Wednesday:** Training
- **Thursday:** REST
- **Friday:** Training
- **Saturday:** Training or competition prep
- **Sunday:** REST

That's 4-5 training days and 2-3 rest days per week. Elite competitors might do 5-6 days, but they've built that work capacity over years of progressive overload.

## Listen to Your Body

Feeling run down after three consecutive training days? Take an extra rest day. The WOD will be there tomorrow. Your joints, tendons, and nervous system need more recovery than your ego wants to admit.

The strongest athletes aren't the ones who train the most. They're the ones who recover the best.`,
        coverImage:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Fitness",
        tags: ["recovery", "programming", "rest-days", "overtraining"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(14),
        createdAt: daysAgo(15),
      },

      // --- Post 5: Recovery ---
      {
        slug: "mobility-vs-flexibility",
        title: "Mobility vs. Flexibility: What CrossFit Athletes Actually Need",
        excerpt:
          "Why being flexible doesn't mean you're mobile — and why it matters for overhead squats, snatches, and injury prevention.",
        content: `## The Confusion

Athletes constantly confuse flexibility and mobility. They sound similar, but they're fundamentally different — and understanding the distinction will change how you warm up, cool down, and train.

## Flexibility: Passive Range of Motion

Flexibility is how far a joint can move when an external force is applied. Lie on your back while someone pushes your leg toward your head — that's passive hamstring flexibility.

**Example:** You can touch your toes in a seated forward fold because gravity is helping you get there.

Flexibility is necessary, but insufficient for CrossFit performance.

## Mobility: Active Control Through Range

Mobility is how far a joint can move under your own muscular control, especially under load. Stand up and lift your leg as high as possible without assistance — that's active hamstring mobility.

**Example:** You can hold a deep overhead squat with a loaded barbell because your shoulders, thoracic spine, hips, and ankles are all actively controlling their positions.

## Why CrossFit Demands Mobility

Every benchmark CrossFit movement requires active control through full range of motion:

- **Overhead squat:** Active shoulder flexion + thoracic extension + hip/ankle mobility — all under load
- **Snatch:** Demands coordinated mobility in every joint simultaneously during an explosive movement
- **Front rack:** Active thoracic extension + wrist flexibility + lat length
- **Pistol squat:** Single-leg hip and ankle mobility with full body control

You can't fake mobility under a loaded barbell. Either you own the position or the position owns you.

## Building Mobility: A Daily Practice

### The 15-Minute Daily Routine

1. **Deep squat hold** — 2 minutes. Sit in the bottom of a squat with heels down, chest up. Use a post for support if needed.
2. **PVC pass-throughs** — 20 reps. Slow, controlled. Progressively narrow your grip over weeks.
3. **Active leg raises** — 10 each leg. Lying on your back, actively lift one leg as high as possible while keeping the other flat.
4. **Thoracic rotations** — 10 each side. On all fours, hand behind head, rotate toward ceiling.
5. **Ankle dorsiflexion** — 2 minutes per side. Knee over toe against a wall, driving the knee forward.

### The Key Principles

- **Load it:** Practice positions with light weight (PVC pipe, empty barbell). Unloaded mobility doesn't always transfer.
- **Active over passive:** Control through full ROM instead of just sitting in positions.
- **Consistency > intensity:** 15 minutes daily beats a 2-hour mobility session once a week.
- **Specificity:** Work on the positions that limit YOUR performance.

## Start Today

You don't need a mobility coach or expensive tools. A PVC pipe, a lacrosse ball, and 15 minutes of daily practice will transform your positions within 8 weeks.

Mobility is the foundation. Build it, and everything else gets easier.`,
        coverImage:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Recovery",
        tags: ["mobility", "flexibility", "injury-prevention", "warm-up"],
        readTime: 5,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(7),
        createdAt: daysAgo(8),
      },

      // --- Post 6: Training (Olympic Lifting) ---
      {
        slug: "olympic-lifting-cues-that-work",
        title: "5 Olympic Lifting Cues That Actually Work",
        excerpt:
          "Simple coaching cues that fixed my snatch and clean technique. No complicated biomechanics — just practical fixes you can use today.",
        content: `## Why Cues Matter

Your brain can't process a paragraph of technical feedback mid-lift. You need one simple thought — a single mental trigger — that produces the right movement pattern.

After coaching hundreds of athletes through thousands of snatches and cleans, these are the five cues that consistently produce the biggest improvements.

## Cue 1: "Push The Floor Away"

**For:** First pull (bar from floor to knees) in the snatch and clean.

**Why it works:** When athletes think "lift the bar," they often pull with their back, leading to early hip rise and the bar drifting forward. Thinking "push the floor away" engages the legs first and maintains proper back angle.

**The difference:** Bar stays close, back stays tight, legs do the work.

## Cue 2: "Patience Off The Floor"

**For:** The transition from first pull to second pull.

**Why it works:** The most common error in Olympic lifting is rushing. Athletes want to explode immediately, but the second pull only works if the bar is in the right position (mid-thigh for the clean, hip crease for the snatch). Being patient through the first pull sets up an explosive second pull.

**The difference:** Controlled speed off the floor, violent speed at the hip.

## Cue 3: "Elbows High and Outside"

**For:** Third pull (the turnover) in the clean.

**Why it works:** Fast elbows = fast turnover. When athletes focus on pulling the bar high, they create a slow, arcing bar path. Driving elbows "high and outside" keeps the bar close and accelerates the turnover.

**The difference:** Bar travels inches instead of feet during the turnover.

## Cue 4: "Meet The Bar"

**For:** The receiving position in both the snatch and clean.

**Why it works:** Most athletes wait for the bar to crash on them. "Meeting the bar" means actively pulling yourself under — a deliberate, aggressive descent into the catch position. This cuts inches off the height you need to pull and gives you more time to stabilize.

**The difference:** Catching the bar at a higher percentage of your pull height.

## Cue 5: "Punch To The Ceiling"

**For:** Overhead lockout in the snatch and jerk.

**Why it works:** A passive catch leads to a wobbly, unstable overhead position. "Punching" creates active shoulder engagement — external rotation, upward push, locked elbows — that stabilizes heavy loads overhead.

**The difference:** Confident lockout instead of a shaky save.

## How to Use Cues Effectively

1. **Pick ONE cue per training session.** Multiple cues create confusion.
2. **Use light weight (60-70% of max).** Cues need reps to become automatic.
3. **Drill 10+ focused reps.** Each rep with deliberate attention on the cue.
4. **Only then add load.** Once the pattern is automatic, start loading.

Master these five cues and your lifts will feel completely different within a training cycle.`,
        coverImage:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Training",
        tags: ["olympic-lifting", "technique", "coaching-cues", "snatch", "clean"],
        readTime: 4,
        isPublished: true,
        isFeatured: false,
        publishedAt: daysAgo(42),
        createdAt: daysAgo(43),
      },

      // --- Post 7: Draft (Unpublished) ---
      {
        slug: "open-preparation-timeline",
        title: "12-Week Open Preparation Timeline",
        excerpt:
          "Strategic programming phases to peak for the CrossFit Open. How to build, maintain, and taper for competition day.",
        content: `## The Framework

Peaking for the Open requires periodized programming — not just "training harder" as the announcement gets closer. This 12-week timeline gives you a structured approach to arrive at Week 1 in the best shape of your life.

## Phase 1: Volume (Weeks 12-9)

**Goal:** Build work capacity and address weaknesses.

This is where you put in the hard yards. Higher volume, moderate intensity. Focus on:
- Aerobic engine development (longer conditioning pieces, 15-25 minutes)
- Skill acquisition (practice movements you avoid)
- Hypertrophy work for lagging muscle groups
- Movement quality over speed

**Weekly structure:** 5-6 training days, 1-2 longer conditioning pieces, 2-3 strength sessions.

## Phase 2: Intensity (Weeks 8-5)

**Goal:** Convert volume into power output.

Shift from "more work" to "harder work." Intensity goes up, volume comes down:
- Shorter, more intense conditioning (8-15 minutes)
- Heavier lifting (working toward peak singles and doubles)
- Sport-specific combinations (classic Open-style couplets and triplets)
- Test benchmark WODs to gauge fitness

**Weekly structure:** 5 training days, sharper conditioning, competition-pace practice.

## Phase 3: Taper (Weeks 4-1)

**Goal:** Arrive fresh, confident, and ready.

The hardest phase psychologically. You'll feel like you should be doing more, but less is more here:
- Reduce volume by 30-40% from Phase 2
- Maintain intensity on key lifts (don't lose peak strength)
- Short, fast conditioning to keep the engine sharp
- Extra sleep, nutrition dialed in, stress management

**Weekly structure:** 4 training days, focused and brief. Rest aggressively.

## Competition Week Tips

[Section in progress — will cover day-of nutrition, warm-up protocols, and heat strategy]`,
        coverImage: null,
        authorName: "Coach Ben",
        category: "Training",
        tags: ["open", "competition", "programming", "periodization"],
        readTime: null,
        isPublished: false,
        isFeatured: false,
        publishedAt: null,
        createdAt: daysAgo(3),
      },

      // --- Post 8: Nutrition ---
      {
        slug: "protein-for-crossfit-athletes",
        title: "How Much Protein Do CrossFit Athletes Really Need?",
        excerpt:
          "Cut through the bro-science. Evidence-based protein intake recommendations for strength and conditioning athletes.",
        content: `## The Short Answer

**1.6-2.2 grams per kilogram of bodyweight per day** for most CrossFit athletes.

For a 75kg (165lb) athlete, that's 120-165g of protein daily. For a 90kg (200lb) athlete, 144-198g daily.

Not complicated. Not controversial. Just science.

## Why Protein Matters for CrossFitters

CrossFit is uniquely demanding because it combines strength training, gymnastics, and metabolic conditioning — often in the same session. This means:

- **Muscle repair:** High-rep movements create significant muscle damage that requires amino acids to rebuild.
- **Strength adaptation:** Progressive overload only works if your body has the raw materials to build stronger tissue.
- **Recovery between sessions:** Adequate protein reduces soreness and accelerates recovery between training days.
- **Body composition:** Higher protein intake supports lean mass while creating satiety that helps manage body fat.

## The Nuance: More Isn't Always Better

Research consistently shows benefits up to about 2.2g/kg. Beyond that? Diminishing returns. You're not harming yourself, but you're not gaining additional muscle-building benefit either.

**Exception:** During a caloric deficit (cutting weight), higher protein intake (up to 2.4g/kg) helps preserve muscle mass. If you're trying to lean out while maintaining performance, err on the higher end.

## Protein Timing: Does It Matter?

**Yes, but less than you think.**

The "anabolic window" — the idea that you must consume protein within 30 minutes of training — has been largely debunked in its extreme form. However, eating protein-rich meals within 2 hours of training does optimize recovery.

**What matters most:**
1. Total daily intake (hit your target every day)
2. Distribution across meals (3-4 protein-rich meals vs. one huge meal)
3. Post-workout timing (within 2 hours, not 30 minutes)

## Practical Meal Targets

Spread your protein across 3-4 meals for optimal muscle protein synthesis:

- **Breakfast:** 30-40g (eggs, Greek yogurt, protein oats)
- **Lunch:** 35-45g (chicken breast, fish, lean beef)
- **Dinner:** 35-45g (salmon, steak, turkey)
- **Snack (optional):** 15-25g (protein shake, cottage cheese, jerky)

## Best Protein Sources

**Animal-based:** Chicken breast (31g/100g), salmon (25g/100g), lean beef (26g/100g), eggs (6g each), Greek yogurt (15-20g/cup).

**Plant-based:** Lentils (18g/cup cooked), chickpeas (15g/cup), tofu (20g/cup), tempeh (31g/cup), protein powder (20-30g/scoop).

**Pro tip:** Mix animal and plant sources throughout the day for a complete amino acid profile and better gut health.

## The Takeaway

Hit 1.6-2.2g/kg daily. Spread it across 3-4 meals. Prioritize whole food sources. Time it reasonably around training. Don't overthink it beyond that.

Protein isn't magic, but it is the single most important macronutrient for a CrossFit athlete. Get it right, and everything else falls into place.`,
        coverImage:
          "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
        category: "Nutrition",
        tags: ["protein", "nutrition", "macros", "recovery"],
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

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const seedReviews = async () => {
  await prisma.marketingReview.createMany({
    data: [
      {
        authorName: "Sarah Mitchell",
        authorRole: "Regional Athlete",
        text: "I've been following The Competitor track for 6 months and my results speak for themselves. PRs on my clean & jerk (+15kg), increased my bar muscle-up capacity from 10 to 25 unbroken, and qualified for Quarterfinals for the first time. The programming is intelligent — the volume is challenging but sustainable, and the periodization makes sense. Worth every penny.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(38),
      },
      {
        authorName: "Mike Thompson",
        authorRole: "Performance RX Member",
        text: "Best programming I've ever followed. The daily WODs are perfectly balanced — enough volume to see real progress without destroying my body. I'm hitting PRs consistently and my engine has never been better. Coach Ben knows how to structure a training cycle that builds on itself week after week.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(31),
      },
      {
        authorName: "Jennifer Park",
        authorRole: "Garage Gym Athlete",
        text: "After my local box closed, I thought my CrossFit days were over. Found The Discipline Program and haven't looked back. The Foundations GPP track gave me the structure I needed to train solo in my garage. The video demos are crystal clear and the progressions are perfectly paced. I actually feel more consistent now than when I had daily class times.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(25),
      },
      {
        authorName: "David Rodriguez",
        authorRole: "Comeback Athlete",
        text: "Took 2 years off for work and family. Coming back at 38 was humbling, but the Foundations track has been perfect for rebuilding my base. Movements are scalable, volume is reasonable, and I'm not wrecked for days after training. Only thing I'd add is more mobility content, but the programming itself is excellent.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(19),
      },
      {
        authorName: "Emma Lawson",
        authorRole: "Open Competitor",
        text: "The Competitor track is absolutely brutal in the best way possible. Two sessions daily keeps me honest and the sport-specific work has carried over directly to my competition results. Finished top 500 worldwide in the Open this year — a massive jump from last year. If you're serious about competing, this is the program.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(16),
      },
      {
        authorName: "Lisa Anderson",
        authorRole: "Masters 45-49",
        text: "I was hesitant about online programming at my age, but Performance RX has been a game-changer. The movement standards keep me accountable and the pacing guidance prevents me from going too hard too fast. My joints feel better than they did 5 years ago, and I'm stronger to boot. Highly recommend for Masters athletes who want smart, sustainable training.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(12),
      },
      {
        authorName: "Tom Bradley",
        authorRole: "Weekend Warrior",
        text: "Great programming for someone who can't commit to 5-6 days per week. The Foundations track works perfectly with my garage gym setup — barbell, plates, pull-up bar, and a jump rope is all I've needed. Deadlift up 30lbs in 3 months and I finally got my first strict pull-up. Solid value for the price.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(8),
      },
      {
        authorName: "Anonymous",
        authorRole: null,
        text: "Decent programming but I found the pacing too slow for my level. Switched to a different program after 2 months. May work better for less experienced athletes.",
        rating: 3,
        isActive: false,
        createdAt: daysAgo(45),
      },
    ],
  });

  console.log("  Reviews: 8 (7 active, 1 inactive)");
};

// ---------------------------------------------------------------------------
// Contact Submissions
// ---------------------------------------------------------------------------

const seedContactSubmissions = async () => {
  await prisma.marketingContactSubmission.createMany({
    data: [
      {
        name: "Alex Chen",
        email: "alex.chen@email.com",
        program: "The Competitor",
        message:
          "Hey! I'm currently training for the Open and looking to step up my programming. I've been doing CrossFit for 3 years and can do most movements RX. How does The Competitor track compare to what I'd get at a competitive affiliate? Do you provide any video feedback on lifts or is it programming only?",
        status: "NEW",
        notes: null,
        createdAt: daysAgo(1),
      },
      {
        name: "Rachel Martinez",
        email: "rachel.m@email.com",
        program: "Foundations GPP",
        message:
          "I have a garage gym with a barbell, plates, pull-up bar, and rings. Will the Foundations track work for me or do I need more equipment like a rower or assault bike? Also, can I start mid-month or do I need to wait until the 1st?",
        status: "NEW",
        notes: null,
        createdAt: daysAgo(2),
      },
      {
        name: "Patricia Johnson",
        email: "patricia.j@email.com",
        program: "Masters 40+",
        message:
          "I'm 52 and have been doing CrossFit for about a year. I noticed the Masters 40+ program is listed but appears inactive. Is this coming back soon? Or would you recommend Performance RX with scaling? I want programming that respects recovery needs at my age.",
        status: "NEW",
        notes: null,
        createdAt: daysAgo(4),
      },
      {
        name: "Mark Sullivan",
        email: "mark.sullivan@email.com",
        program: null,
        message:
          "I'm interested in signing up but have a question about billing. Do you offer any discounts for annual subscriptions instead of monthly? I'm committed to training long-term and would prefer to pay upfront if there's a savings. Also curious about family plans — my wife and I both train.",
        status: "IN_PROGRESS",
        notes: "Sent annual pricing info and family discount options. Waiting for reply.",
        createdAt: daysAgo(5),
      },
      {
        name: "Sophie Williams",
        email: "sophie.w@email.com",
        program: "Performance RX",
        message:
          "I signed up yesterday but I'm not seeing the workouts in my account. I received the confirmation email but when I log in, the training section is empty. Can someone help me troubleshoot? Really excited to get started and don't want to miss today's session!",
        status: "IN_PROGRESS",
        notes: "Likely a subscription sync issue. Escalated to check Stripe webhook logs.",
        createdAt: daysAgo(3),
      },
      {
        name: "Brian Foster",
        email: "brian.foster@email.com",
        program: "Foundations GPP",
        message:
          "I'm 6 weeks into Foundations and loving it — the progressions are perfectly paced. I'm ready for more volume and wondering when to move up to Performance RX. I can do most movements but my gymnastics are still developing (only 2-3 strict pull-ups). Should I wait until I'm stronger?",
        status: "REPLIED",
        notes:
          "Recommended staying on Foundations for 2 more weeks until he hits 5 strict pull-ups consistently.",
        createdAt: daysAgo(11),
      },
      {
        name: "Christina Lee",
        email: "christina.lee@email.com",
        program: "Performance RX",
        message:
          "I'm dealing with a nagging shoulder issue (rotator cuff tendinitis from overhead work). Are there movement substitutions built into the programming or should I consult with my PT first? I don't want to make it worse but also don't want to take time completely off training.",
        status: "REPLIED",
        notes:
          "Advised to consult PT first. Sent list of common overhead substitutions (DB press → landmine press, etc.).",
        createdAt: daysAgo(15),
      },
      {
        name: "Jason Miller",
        email: "jason.m@email.com",
        program: "The Competitor",
        message:
          "Just wanted to say thanks for the incredible programming. Four months on The Competitor track and I just hit a 20lb PR on my back squat. Also qualified for Quarterfinals for the first time in my career. The structure and progressive overload have been exactly what I needed. Keep up the amazing work!",
        status: "CLOSED",
        notes:
          "Success story — added to testimonials list. Asked permission to feature on social media.",
        createdAt: daysAgo(18),
      },
      {
        name: "Kevin Davis",
        email: "kevin@crossfitcentral.com",
        program: null,
        message:
          "Hi Coach Ben, I run a CrossFit affiliate in Austin, TX. I'm interested in potentially using your programming for our competitors class (about 8-12 athletes). Would you be open to discussing bulk licensing or affiliate partnerships? Happy to jump on a call whenever works for you.",
        status: "CLOSED",
        notes:
          "Had a call. Not ready for affiliate partnerships yet — revisit in Q3 when platform is more mature.",
        createdAt: daysAgo(14),
      },
      {
        name: "Nicole Anderson",
        email: "nicole.a@email.com",
        program: "Foundations GPP",
        message:
          "Quick question — do you have a mobile app or is everything web-based? I'd love to log workouts from my phone at the gym without having to open a browser. Also, are the video demonstrations detailed enough for someone training completely solo without a coach watching?",
        status: "CLOSED",
        notes: "Explained PWA is in development. She signed up for Foundations in the meantime.",
        createdAt: daysAgo(20),
      },
    ],
  });

  console.log("  Contacts: 10 (3 NEW, 2 IN_PROGRESS, 2 REPLIED, 3 CLOSED)");
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  console.log("🌱 Starting enriched seed...\n");

  await clearAll();

  const passwordHash = await bcrypt.hash("password123", 12);

  await seedUsers(passwordHash);
  await seedExerciseCategories();
  await seedExercises();
  await seedMarketingPages();
  await seedProducts();
  await seedBlogPosts();
  await seedReviews();
  await seedContactSubmissions();

  console.log("\n✅ Seed completed!");
  console.log("   Admin login: admin@example.com / password123");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
