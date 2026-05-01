import { type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";

export const seedBlogPosts = async (db: PrismaClient): Promise<void> => {
  await db.marketingBlogPost.createMany({
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
        category: "TRAINING",
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
        category: "NUTRITION",
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
        category: "MINDSET",
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
        category: "FITNESS",
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
        category: "RECOVERY",
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
        category: "TRAINING",
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
        category: "TRAINING",
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
        category: "NUTRITION",
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
