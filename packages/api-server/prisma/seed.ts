import {
  Gender,
  PlanEnrollmentStatus,
  PrismaClient,
  type Prisma,
  Role,
  TrainingPlanStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (days: number): Date => {
  const d = new Date();

  d.setDate(d.getDate() - days);

  return d;
};

const daysFromNow = (days: number): Date => {
  const d = new Date();

  d.setDate(d.getDate() + days);

  return d;
};

const utcDay = (offset: number): Date => {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset));
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

const createWorkout = async (
  planId: string,
  scheduledDate: Date | null,
  title: string,
  content: string,
  sortOrder = 0,
) => {
  return prisma.workout.create({
    data: { planId, scheduledDate, title, content, sortOrder, createdAt: daysAgo(30) },
  });
};

const seedTrainingData = async (coachProfileId: string) => {
  const plan1 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Competitor Season 1",
      description:
        "High-volume programming for Open/Quarterfinals preparation. 2 sessions/day with sport-specific skill work.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(45),
    },
  });

  const plan2 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Performance RX",
      description:
        "Daily WOD programming for dedicated athletes. 60-minute sessions combining strength, skill, and conditioning.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(40),
    },
  });

  const plan3 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Foundations",
      description:
        "General Physical Preparedness for new athletes. Emphasis on movement quality and building base.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(35),
    },
  });

  const plan4 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Strength Cycle",
      description: "4-week hypertrophy block. Heavy barbell work with programmed deloads.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(30),
    },
  });

  const plan5 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Onboarding Assessment",
      description:
        "Skill assessment templates for new athletes. Workouts assigned after initial consultation.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(10),
    },
  });

  await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Off-Season Deload",
      description: "8-week deload cycle. Low volume, recovery focus.",
      status: TrainingPlanStatus.DRAFT,
      createdAt: daysAgo(5),
    },
  });

  await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Legacy 2024",
      description: "Archived program from last year.",
      status: TrainingPlanStatus.ARCHIVED,
      createdAt: daysAgo(120),
    },
  });

  const p1w1 = await createWorkout(
    plan1.id,
    utcDay(-10),
    "Day 1: Heavy Squats + Fran",
    'A. Warm-Up\n3 rounds:\n200m Row\n10 PVC Pass-Throughs\n10 Air Squats\n\nB. Strength: Back Squat\nEvery 2:30 x 5 sets\n6 @ 155lb\n6 @ 165lb\n6 @ 175lb\n6 @ 185lb\n6 @ 185lb\n\nC. Metcon — "Fran" (For Time, 12 min cap)\n21-15-9\nThrusters (95/65 lb)\nPull-Ups\n\nD. Accessory\n3x15 GHD Sit-Ups\n3x8 Poliquin Step-Ups (35lb DBs)',
  );

  const p1w2 = await createWorkout(
    plan1.id,
    utcDay(-8),
    "Day 2: Olympic Lifting",
    "A. Warm-Up\n2 rounds:\n10 Samson Stretches\n15 PVC Pass-Throughs\n\nB. Clean & Jerk\nEvery 3:00 x 5 sets\n2 @ 155lb\n2 @ 165lb\n2 @ 175lb\n2 @ 185lb\n2 @ 195lb\n\nC. Snatch\nEvery 2:30 x 5 sets\n2 @ 115lb\n2 @ 125lb\n2 @ 135lb\n2 @ 145lb\n2 @ 155lb\n\nD. Cool-Down\n3x1 min each side Pigeon Stretch",
  );

  const p1w3 = await createWorkout(
    plan1.id,
    utcDay(-5),
    "Day 3: Gymnastics + Metcon",
    "A. Gymnastics EMOM 16\nMin 1-4: 3 Bar Muscle-Ups\nMin 5-8: 50ft Handstand Walk\nMin 9-12: 8 Toes-to-Bar\nMin 13-16: 10 Ring Dips\n\nB. AMRAP 15 (5 round cap)\n20 Wall Balls (20 lb)\n15 Box Jumps (24 in)\n12 KB Swings (53 lb)",
  );

  const p1w4 = await createWorkout(
    plan1.id,
    utcDay(-3),
    "Day 4: Pressing + Engine",
    "A. Push Press\nEvery 2:00 x 5 sets\n5 @ 115lb / 125 / 135 / 145 / 155lb\n\nB. Bench Press\nEvery 2:00 x 5 sets\n5 @ 155lb / 165 / 175 / 185 / 185lb\n\nC. Cardio Chipper (For Time, 20 min cap)\n30 cal Assault Bike\n400m Run\n30 cal Ski Erg\n400m Run\n30 cal Row",
  );

  const p1w5 = await createWorkout(
    plan1.id,
    utcDay(-1),
    "Day 5: Deadlift + DT",
    'A. Deadlift\nEvery 3:00 x 5 sets\n3 @ 275lb / 295 / 315 / 335 / 345lb\n\nB. "DT" — 5 Rounds For Time (10 min cap)\n12 Deadlifts (155 lb)\n9 Hang Power Cleans (155 lb)\n6 Push Jerks (155 lb)',
  );

  const p1w6 = await createWorkout(
    plan1.id,
    utcDay(0),
    "Day 6: Snatch Complex",
    "A. Warm-Up\n3 rounds:\n1 min each Couch Stretch\n15 PVC Pass-Throughs\n\nB. Power Snatch\nEvery 2:30 x 5 sets\n2 @ 115lb / 125 / 135 / 145 / 155lb\n\nC. Tabata Assault Bike\n8 rounds: 20s on / 10s off\nMax calories each round",
  );

  const p1w7 = await createWorkout(
    plan1.id,
    utcDay(2),
    "Day 7: Gymnastics Volume",
    "A. EMOM 20\nMin 1-5: 3 Bar Muscle-Ups\nMin 6-10: 7 Handstand Push-Ups\nMin 11-15: 10 Chest-to-Bar Pull-Ups\nMin 16-20: 8 Pistol Squats (alternating)\n\nB. Accessory\n3x20 Banded Pull-Aparts\n3x15 Face Pulls",
  );

  const p1w8 = await createWorkout(
    plan1.id,
    utcDay(4),
    "Day 8: Squat + Sprint",
    "A. Front Squat\nEvery 2:30 x 5 sets\n3 @ 185lb / 195 / 205 / 215 / 225lb\n\nB. Sprint (For Time, 10 min cap)\n10 Burpees + 10 Thrusters (135 lb)\n8 Burpees + 8 Thrusters (135 lb)\n6 Burpees + 6 Thrusters (135 lb)",
  );

  const p2w1 = await createWorkout(
    plan2.id,
    utcDay(-11),
    "Monday: Strength + Metcon",
    "A. Back Squat\nEvery 2:30 x 5 sets\n5 @ 155lb / 165 / 175 / 185 / 195lb\n\nB. AMRAP 12\n15 Wall Balls (20 lb)\n50 Double Unders\n10 Toes-to-Bar",
  );

  const p2w2 = await createWorkout(
    plan2.id,
    utcDay(-9),
    "Tuesday: Conditioning",
    "A. 5 Rounds For Time (25 min cap)\n500m Row\n15 Burpees",
  );

  const p2w3 = await createWorkout(
    plan2.id,
    utcDay(-6),
    "Wednesday: Olympic + Skill",
    "A. Power Clean\nEvery 2:00 x 5 sets\n3 @ 135lb / 145 / 155 / 165 / 175lb\n\nB. EMOM 12\nMin 1: 8 Pull-Ups\nMin 2: 5 Handstand Push-Ups\nMin 3: 8 Ring Dips\n(repeat 4x)",
  );

  const p2w4 = await createWorkout(
    plan2.id,
    utcDay(-4),
    "Thursday: Midline + Metcon",
    "A. Midline\n3x20 GHD Sit-Ups\n3x15 Hip Extensions\n\nB. Chipper (For Time, 20 min cap)\n50 KB Swings (53 lb)\n40 Box Jumps (24 in)\n30 Wall Balls (20 lb)\n20 Burpees\n10 Pull-Ups",
  );

  const p2w5 = await createWorkout(
    plan2.id,
    utcDay(-2),
    "Friday: Deadlift + Metcon",
    "A. Deadlift\nEvery 2:30 x 5 sets\n5 @ 185lb / 205 / 225 / 245 / 265lb\n\nB. AMRAP 10\n10 DB Snatches (50 lb, alternating)\n10 Burpees\n40 Double Unders",
  );

  const p2w6 = await createWorkout(
    plan2.id,
    utcDay(0),
    "Saturday: Team Workout",
    "A. Partner Helen — 3 Rounds For Time (20 min cap)\n400m Run\n21 KB Swings (53 lb)\n12 Pull-Ups\n(split work as needed)",
  );

  const p2w7 = await createWorkout(
    plan2.id,
    utcDay(1),
    "Monday: Squat Repeat",
    "A. Back Squat\nEvery 2:30 x 5 sets\n5 @ 165lb / 175 / 185 / 195 / 205lb\n\nB. Tabata Double Unders\n8 rounds: 20s on / 10s off\nMax reps each round",
  );

  const p2w8 = await createWorkout(
    plan2.id,
    utcDay(3),
    "Tuesday: Conditioning Day",
    "A. Row + Bike (For Time, 30 min cap)\n2000m Row\n40 cal Assault Bike\n\nB. AMRAP 8\n15 KB Swings (53 lb)\n50 Double Unders",
  );

  const p3w1 = await createWorkout(
    plan3.id,
    utcDay(-5),
    "Intro: Movement Basics",
    "A. Warm-Up\n400m Jog\n2x15 PVC Pass-Throughs\n2x10 Samson Stretches\n\nB. Back Squat\nEvery 2:00 x 3 sets\n10 @ 65lb (RPE 5)\n\nC. Deadlift\nEvery 2:00 x 3 sets\n8 @ 95lb (RPE 5)",
  );

  const p3w2 = await createWorkout(
    plan3.id,
    utcDay(-2),
    "Day 2: Light Metcon",
    "A. AMRAP 10\n8 Burpees\n10 Box Jumps (20 in)\n12 KB Swings (35 lb)\n\nB. Cool-Down\n2 min each side Pigeon Stretch\n2 min each side Couch Stretch",
  );

  const p3w3 = await createWorkout(
    plan3.id,
    utcDay(0),
    "Day 3: Cardio Base",
    "A. Row 2000m at easy pace (30 min cap)\n\nB. Single Unders\n3x100 reps",
  );

  const p3w4 = await createWorkout(
    plan3.id,
    utcDay(3),
    "Day 4: Upper Body Intro",
    "A. Bench Press\nEvery 1:30 x 3 sets\n8 @ 65lb (RPE 5)\n\nB. Push Press\nEvery 1:30 x 3 sets\n8 @ 55lb (RPE 5)\n\nC. Accessory\n3x15 Banded Pull-Aparts\n3x12 Face Pulls",
  );

  const p4w1 = await createWorkout(
    plan4.id,
    utcDay(-18),
    "Week 1: Squat Focus",
    "A. Back Squat\nEvery 2:30 x 4 sets\n8 @ 165lb / 175 / 185 / 195lb\n\nB. Front Squat\nEvery 2:00 x 3 sets\n8 @ 135lb / 145 / 155lb",
  );

  const p4w2 = await createWorkout(
    plan4.id,
    utcDay(-14),
    "Week 2: Deadlift Focus",
    "A. Deadlift\nEvery 3:00 x 5 sets\n5 @ 225lb / 245 / 265 / 275 / 285lb\n\nB. Accessory\n3x20 GHD Sit-Ups\n3x15 Hip Extensions",
  );

  const p4w3 = await createWorkout(
    plan4.id,
    utcDay(-9),
    "Week 3: Press Focus",
    "A. Bench Press\nEvery 2:30 x 5 sets\n5 @ 145lb / 155 / 165 / 175 / 185lb\n\nB. Push Press\nEvery 2:00 x 4 sets\n6 @ 105lb / 115 / 125 / 135lb",
  );

  const p4w4 = await createWorkout(
    plan4.id,
    utcDay(-5),
    "Week 4 Day 1: Heavy Squat",
    "A. Back Squat\nEvery 3:00 x 5 sets\n3 @ 205lb / 215 / 225 / 235 / 245lb",
  );

  const p4w5 = await createWorkout(
    plan4.id,
    utcDay(-3),
    "Week 4 Day 2: Heavy Deadlift",
    "A. Deadlift\nEvery 3:00 x 5 sets\n3 @ 275lb / 295 / 315 / 335 / 345lb",
  );

  const p4w6 = await createWorkout(
    plan4.id,
    utcDay(-1),
    "Week 4 Day 3: Heavy Press",
    "A. Bench Press\nEvery 2:30 x 5 sets\n3 @ 175lb / 185 / 195 / 205 / 205lb\n\nB. Push Jerk\nEvery 2:00 x 4 sets\n3 @ 155lb / 165 / 175 / 185lb",
  );

  const p4w7 = await createWorkout(
    plan4.id,
    utcDay(1),
    "Week 4 Day 4: Accessory",
    "A. Accessory\n4x15 GHD Sit-Ups\n4x12 Poliquin Step-Ups (35lb DBs)\n4x15 Face Pulls",
  );

  await createWorkout(
    plan5.id,
    null,
    "Assessment: Barbell Basics",
    "A. Back Squat — Find working weight\n3x5 (start empty bar, add weight each set)\n\nB. Deadlift — Find working weight\n3x5 (start empty bar, add weight each set)",
  );

  await createWorkout(
    plan5.id,
    null,
    "Assessment: Conditioning",
    "A. 500m Row — max effort (5 min cap)\n\nB. Assault Bike — 15 cal max effort (5 min cap)",
  );

  await createWorkout(
    plan5.id,
    null,
    "Assessment: Gymnastics",
    "A. Bar Muscle-Up Test\n3 attempts, max reps each\n\nB. Handstand Walk Test\n3 attempts, max distance each",
  );

  console.log("  Training plans: 7 (5 ACTIVE, 1 DRAFT, 1 ARCHIVED)");
  console.log("  Workouts: 27 (24 scheduled + 3 template)");

  return {
    plans: { plan1, plan2, plan3, plan4, plan5 },
    workouts: {
      p1: [p1w1, p1w2, p1w3, p1w4, p1w5, p1w6, p1w7, p1w8],
      p2: [p2w1, p2w2, p2w3, p2w4, p2w5, p2w6, p2w7, p2w8],
      p3: [p3w1, p3w2, p3w3, p3w4],
      p4: [p4w1, p4w2, p4w3, p4w4, p4w5, p4w6, p4w7],
    },
  };
};

const seedEnrollments = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  plans: Awaited<ReturnType<typeof seedTrainingData>>["plans"],
) => {
  await prisma.planEnrollment.createMany({
    data: [
      {
        trainingPlanId: plans.plan1.id,
        userId: users.sarah.id,
        startDate: daysAgo(30),
        endDate: daysFromNow(30),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan1.id,
        userId: users.jenny.id,
        startDate: daysAgo(20),
        endDate: daysFromNow(40),
        status: PlanEnrollmentStatus.ACTIVE,
      },

      {
        trainingPlanId: plans.plan2.id,
        userId: users.mike.id,
        startDate: daysAgo(25),
        endDate: daysFromNow(35),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan2.id,
        userId: users.maria.id,
        startDate: daysAgo(18),
        endDate: daysFromNow(42),
        status: PlanEnrollmentStatus.ACTIVE,
      },

      {
        trainingPlanId: plans.plan3.id,
        userId: users.david.id,
        startDate: daysAgo(4),
        status: PlanEnrollmentStatus.ACTIVE,
      },

      {
        trainingPlanId: plans.plan4.id,
        userId: users.alex.id,
        startDate: daysAgo(35),
        endDate: daysFromNow(25),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan4.id,
        userId: users.lisa.id,
        startDate: daysAgo(25),
        endDate: daysFromNow(35),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan4.id,
        userId: users.nina.id,
        startDate: daysAgo(25),
        endDate: daysFromNow(35),
        status: PlanEnrollmentStatus.ACTIVE,
      },

      {
        trainingPlanId: plans.plan5.id,
        userId: users.tom.id,
        startDate: daysAgo(2),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan5.id,
        userId: users.chris.id,
        startDate: daysAgo(1),
        status: PlanEnrollmentStatus.ACTIVE,
      },
    ],
  });

  console.log("  Enrollments: 10 active across 5 plans");
};

const seedWorkoutLogs = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  workouts: Awaited<ReturnType<typeof seedTrainingData>>["workouts"],
) => {
  const createLog = async (
    userId: string,
    workoutId: string,
    date: Date,
    isRx: boolean,
    notes: string | null,
  ) => {
    await prisma.workoutLog.create({
      data: { userId, workoutId, date, isRx, notes, createdAt: date },
    });
  };

  await createLog(users.sarah.id, at(workouts.p1, 0).id, utcDay(-10), true, null);
  await createLog(
    users.sarah.id,
    at(workouts.p1, 1).id,
    utcDay(-8),
    true,
    "Feeling strong on cleans",
  );
  await createLog(users.sarah.id, at(workouts.p1, 2).id, utcDay(-5), true, null);
  await createLog(users.sarah.id, at(workouts.p1, 3).id, utcDay(-3), true, null);
  await createLog(users.sarah.id, at(workouts.p1, 4).id, utcDay(-1), true, "PR on deadlift!");
  await createLog(users.sarah.id, at(workouts.p1, 5).id, new Date(), true, "Morning session done");

  await createLog(users.jenny.id, at(workouts.p1, 0).id, utcDay(-10), true, null);
  await createLog(users.jenny.id, at(workouts.p1, 1).id, utcDay(-8), true, null);
  await createLog(users.jenny.id, at(workouts.p1, 2).id, utcDay(-5), true, null);
  await createLog(users.jenny.id, at(workouts.p1, 3).id, utcDay(-3), false, "Scaled push press");
  await createLog(users.jenny.id, at(workouts.p1, 4).id, utcDay(-1), true, null);
  await createLog(users.jenny.id, at(workouts.p1, 5).id, new Date(), true, null);

  await createLog(users.mike.id, at(workouts.p2, 0).id, utcDay(-11), true, null);
  await createLog(users.mike.id, at(workouts.p2, 1).id, utcDay(-9), true, null);
  await createLog(users.mike.id, at(workouts.p2, 2).id, utcDay(-6), true, null);
  await createLog(users.mike.id, at(workouts.p2, 3).id, utcDay(-4), true, null);
  await createLog(users.mike.id, at(workouts.p2, 4).id, utcDay(-2), true, null);

  await createLog(users.maria.id, at(workouts.p2, 0).id, utcDay(-11), true, null);
  await createLog(users.maria.id, at(workouts.p2, 1).id, utcDay(-9), true, null);
  await createLog(users.maria.id, at(workouts.p2, 2).id, utcDay(-6), true, null);
  await createLog(users.maria.id, at(workouts.p2, 3).id, utcDay(-4), true, null);
  await createLog(users.maria.id, at(workouts.p2, 4).id, utcDay(-2), true, null);
  await createLog(users.maria.id, at(workouts.p2, 5).id, new Date(), true, "Early bird done");

  await createLog(users.david.id, at(workouts.p3, 0).id, utcDay(-5), true, "First workout ever");
  await createLog(users.david.id, at(workouts.p3, 1).id, utcDay(-2), true, null);

  await createLog(users.alex.id, at(workouts.p4, 0).id, utcDay(-18), true, null);
  await createLog(users.alex.id, at(workouts.p4, 1).id, utcDay(-14), true, "Knee started hurting");

  await createLog(users.lisa.id, at(workouts.p4, 0).id, utcDay(-18), false, null);
  await createLog(users.lisa.id, at(workouts.p4, 1).id, utcDay(-14), false, "Shoulder pain");
  await createLog(users.lisa.id, at(workouts.p4, 2).id, utcDay(-9), false, "Light weights only");
  await createLog(
    users.lisa.id,
    at(workouts.p4, 3).id,
    utcDay(-5),
    false,
    "Last session before rest",
  );

  await createLog(users.nina.id, at(workouts.p4, 0).id, utcDay(-18), true, null);
  await createLog(users.nina.id, at(workouts.p4, 1).id, utcDay(-14), true, null);
  await createLog(users.nina.id, at(workouts.p4, 2).id, utcDay(-9), true, "Dropped off after this");

  console.log(
    "  Workout logs: Sarah 6, Jenny 6, Mike 5, Maria 6, David 2, Alex 2, Lisa 4, Nina 3 (Tom 0, Chris 0)",
  );
  console.log(
    "  Dashboard expects: COMPLETED(Sarah,Jenny,Maria), PENDING(Mike,David), MISSED(Alex,Lisa,Nina), NO_SCHEDULE(Tom,Chris)",
  );
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
        items: [
          {
            title: "Wingate Sport Institute",
            description: "Diploma in Sport Coaching and Training (Israel).",
          },
          {
            title: "CrossFit Coach",
            description: "CrossFit training methodology and programming.",
          },
          {
            title: "Weightlifting Instructor",
            description: "Olympic lifting technique and coaching.",
          },
          {
            title: "Adaptive CrossFit Specialist",
            description: "Inclusive programming for athletes with disabilities.",
          },
        ],
      },
    },
    {
      pageSlug: "about",
      section: "personal",
      data: {
        title: "Outside The Box",
        description: "Trail running in the Carpathians, grilling meat, and building software.",
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
        workingHours: "Mon-Fri: 8:00 - 20:00 (Kyiv time)\nSat: 9:00 - 14:00\nSun: Rest Day",
      },
    },
    {
      pageSlug: "contact",
      section: "faq",
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
        authorName: "Anonymous",
        authorRole: null,
        text: "Decent programming but pacing was too slow for my level. Switched after 2 months.",
        rating: 3,
        isActive: false,
        createdAt: daysAgo(45),
      },
    ],
  });

  console.log("  Reviews: 8 (7 active, 1 inactive)");
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
  const { plans, workouts } = await seedTrainingData(coachProfile.id);

  await seedEnrollments(users, plans);
  await seedWorkoutLogs(users, workouts);
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
  console.log("\n  Dashboard scenarios:");
  console.log("    COMPLETED: Sarah, Jenny, Maria (today workout logged)");
  console.log("    PENDING:   Mike, David (today workout not logged)");
  console.log("    MISSED:    Alex (injured, 14d ago), Lisa (restricted, 5d ago), Nina (10d ago)");
  console.log("    NO_SCHEDULE: Tom (new, 2d), Chris (new, 1d)");
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
