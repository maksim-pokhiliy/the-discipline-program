import {
  Gender,
  PlanEnrollmentStatus,
  PrismaClient,
  type Prisma,
  Role,
  TrainingPlanStatus,
  Unit,
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

const todayAt = (hours: number, minutes = 0): Date => {
  const d = new Date();

  d.setHours(hours, minutes, 0, 0);

  return d;
};

const clearAll = async () => {
  await prisma.setLog.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.prescribedSet.deleteMany();
  await prisma.workoutBlock.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.userBenchmark.deleteMany();
  await prisma.benchmarkDefinition.deleteMany();
  await prisma.coachNote.deleteMany();
  await prisma.coachActionItem.deleteMany();
  await prisma.planEnrollment.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.exerciseCategory.deleteMany();
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
        createdAt: daysAgo(90),
      },
    }),
    prisma.user.create({
      data: {
        email: "coach.ben@thedisciplineprogram.com",
        name: "Ben Sergeev",
        role: Role.COACH,
        password: passwordHash,
        createdAt: daysAgo(60),
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah.mitchell@email.com",
        name: "Sarah Mitchell",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(55),
      },
    }),
    prisma.user.create({
      data: {
        email: "mike.thompson@email.com",
        name: "Mike Thompson",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(48),
      },
    }),
    prisma.user.create({
      data: {
        email: "jenny.park@email.com",
        name: "Jenny Park",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(34),
      },
    }),
    prisma.user.create({
      data: {
        email: "david.rodriguez@email.com",
        name: "David Rodriguez",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(28),
      },
    }),
    prisma.user.create({
      data: {
        email: "lisa.anderson@email.com",
        name: "Lisa Anderson",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(12),
      },
    }),
    prisma.user.create({
      data: {
        email: "tom.bradley@email.com",
        name: "Tom Bradley",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(5),
      },
    }),
    prisma.user.create({
      data: {
        email: "alex.kovac@email.com",
        name: "Alex Kovac",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(40),
      },
    }),
    prisma.user.create({
      data: {
        email: "nina.reyes@email.com",
        name: "Nina Reyes",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(30),
      },
    }),
    prisma.user.create({
      data: {
        email: "chris.walker@email.com",
        name: "Chris Walker",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(2),
      },
    }),
    prisma.user.create({
      data: {
        email: "maria.santos@email.com",
        name: "Maria Santos",
        role: Role.USER,
        password: passwordHash,
        createdAt: daysAgo(6),
      },
    }),
  ]);

  console.log("  Users: 12 (1 admin, 1 coach, 10 athletes)");

  return {
    admin: users[0]!,
    coach: users[1]!,
    sarah: users[2]!,
    mike: users[3]!,
    jenny: users[4]!,
    david: users[5]!,
    lisa: users[6]!,
    tom: users[7]!,
    alex: users[8]!,
    nina: users[9]!,
    chris: users[10]!,
    maria: users[11]!,
  };
};

const seedProfiles = async (users: Awaited<ReturnType<typeof seedUsers>>) => {
  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: users.coach.id,
      bio: "10+ years coaching competitive CrossFit athletes. Games athlete mindset. L3 CCFT certified.",
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

  console.log("  Profiles: 1 coach, 10 athlete");

  return coachProfile;
};

const seedExercises = async () => {
  const categories = await Promise.all([
    prisma.exerciseCategory.create({ data: { name: "Strength", sortOrder: 0 } }),
    prisma.exerciseCategory.create({ data: { name: "Metcon", sortOrder: 1 } }),
    prisma.exerciseCategory.create({ data: { name: "Cardio", sortOrder: 2 } }),
    prisma.exerciseCategory.create({ data: { name: "Accessory", sortOrder: 3 } }),
    prisma.exerciseCategory.create({ data: { name: "Warmup", sortOrder: 4 } }),
    prisma.exerciseCategory.create({ data: { name: "Skill", sortOrder: 5 } }),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id])) as Record<
    string,
    string
  >;

  const exerciseData: Prisma.ExerciseCreateManyInput[] = [
    { name: "Back Squat", categoryId: catMap["Strength"] },
    { name: "Deadlift", categoryId: catMap["Strength"] },
    { name: "Bench Press", categoryId: catMap["Strength"] },
    { name: "Overhead Press", categoryId: catMap["Strength"] },
    { name: "Front Squat", categoryId: catMap["Strength"] },
    { name: "Clean & Jerk", categoryId: catMap["Skill"] },
    { name: "Snatch", categoryId: catMap["Skill"] },
    { name: "Bar Muscle-Up", categoryId: catMap["Skill"] },
    { name: "Ring Muscle-Up", categoryId: catMap["Skill"] },
    { name: "Handstand Walk", categoryId: catMap["Skill"] },
    { name: "Burpee", categoryId: catMap["Metcon"] },
    { name: "Wall Ball", categoryId: catMap["Metcon"] },
    { name: "Box Jump", categoryId: catMap["Metcon"] },
    { name: "Kettlebell Swing", categoryId: catMap["Metcon"] },
    { name: "Rowing", categoryId: catMap["Cardio"] },
    { name: "Assault Bike", categoryId: catMap["Cardio"] },
    { name: "Running", categoryId: catMap["Cardio"] },
    { name: "Jump Rope", categoryId: catMap["Cardio"] },
    { name: "Tricep Pushdown", categoryId: catMap["Accessory"] },
    { name: "Lateral Raise", categoryId: catMap["Accessory"] },
    { name: "GHD Sit-Up", categoryId: catMap["Accessory"] },
    { name: "PVC Pass-Through", categoryId: catMap["Warmup"] },
    { name: "Arm Circles", categoryId: catMap["Warmup"] },
    { name: "Jumping Jacks", categoryId: catMap["Warmup"] },
  ];

  await prisma.exercise.createMany({ data: exerciseData });
  const exercises = await prisma.exercise.findMany();
  const exMap = Object.fromEntries(exercises.map((e) => [e.name, e.id])) as Record<string, string>;

  console.log("  Exercise categories: 6, Exercises: 24");

  return { catMap, exMap };
};

type ExMap = Record<string, string>;
type CatMap = Record<string, string>;

const seedTrainingData = async (coachProfileId: string, catMap: CatMap, exMap: ExMap) => {
  const createWorkoutWithBlocks = async (
    planId: string,
    dayOrder: number,
    title: string,
    blocks: {
      categoryId: string;
      rounds?: number;
      timeCapSec?: number;
      sets: {
        exerciseId: string;
        sets?: number;
        reps?: number;
        weightValue?: number;
        weightUnit?: Unit;
        rpe?: number;
        notes?: string;
      }[];
    }[],
  ) => {
    const workout = await prisma.workout.create({
      data: { planId, dayOrder, title, createdAt: daysAgo(30) },
    });

    for (const block of blocks) {
      await prisma.workoutBlock.create({
        data: {
          workoutId: workout.id,
          categoryId: block.categoryId,
          rounds: block.rounds,
          timeCapSec: block.timeCapSec,
          sets: {
            create: block.sets.map((s) => ({
              exerciseId: s.exerciseId,
              sets: s.sets,
              reps: s.reps,
              weightValue: s.weightValue,
              weightUnit: s.weightUnit ?? Unit.KG,
              rpe: s.rpe,
              notes: s.notes,
            })),
          },
        },
      });
    }

    return workout;
  };

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
      name: "Performance RX Q1",
      description:
        "Daily WOD programming for dedicated athletes. 60-minute sessions combining strength, skill, and conditioning.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(40),
    },
  });

  const plan3 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Foundations Starter",
      description:
        "General Physical Preparedness for new athletes. Emphasis on movement quality and building base.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(35),
    },
  });

  const plan4 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Off-Season Strength Block",
      description:
        "8-week hypertrophy and strength-focused cycle. Low metcon volume, high barbell work.",
      status: TrainingPlanStatus.DRAFT,
      createdAt: daysAgo(10),
    },
  });

  const plan5 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Old Program 2024",
      description: "Archived program from last year. No longer in use.",
      status: TrainingPlanStatus.ARCHIVED,
      createdAt: daysAgo(120),
    },
  });

  const plan6 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Legacy Competition Prep",
      description:
        "Still has one active athlete enrolled. Cannot be deleted until enrollment ends.",
      status: TrainingPlanStatus.ARCHIVED,
      createdAt: daysAgo(90),
    },
  });

  const p1w1 = await createWorkoutWithBlocks(plan1.id, 1, "Day 1: Heavy Squats + Sprint", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Back Squat"]!, sets: 5, reps: 3, weightValue: 100, rpe: 8 },
        { exerciseId: exMap["Front Squat"]!, sets: 3, reps: 5, weightValue: 80, rpe: 7 },
      ],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 3,
      timeCapSec: 720,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 15 },
        { exerciseId: exMap["Box Jump"]!, reps: 12 },
      ],
    },
  ]);

  const p1w2 = await createWorkoutWithBlocks(plan1.id, 2, "Day 2: Olympic Lifting", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Clean & Jerk"]!, sets: 5, reps: 2, weightValue: 85, rpe: 9 },
        { exerciseId: exMap["Snatch"]!, sets: 5, reps: 2, weightValue: 65, rpe: 8 },
      ],
    },
    {
      categoryId: catMap["Accessory"]!,
      sets: [{ exerciseId: exMap["GHD Sit-Up"]!, sets: 3, reps: 15 }],
    },
  ]);

  const p1w3 = await createWorkoutWithBlocks(plan1.id, 3, "Day 3: Gymnastics + Metcon", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Bar Muscle-Up"]!, sets: 5, reps: 3 },
        { exerciseId: exMap["Handstand Walk"]!, sets: 4, reps: 1, notes: "50ft attempts" },
      ],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 5,
      timeCapSec: 900,
      sets: [
        { exerciseId: exMap["Wall Ball"]!, reps: 20 },
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 15 },
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "250m" },
      ],
    },
  ]);

  const p1w4 = await createWorkoutWithBlocks(plan1.id, 4, "Day 4: Pressing + Cardio", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Bench Press"]!, sets: 5, reps: 5, weightValue: 70, rpe: 7 },
        { exerciseId: exMap["Overhead Press"]!, sets: 4, reps: 6, weightValue: 50, rpe: 7 },
      ],
    },
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 1200,
      sets: [
        { exerciseId: exMap["Assault Bike"]!, reps: 1, notes: "30 cal" },
        { exerciseId: exMap["Running"]!, reps: 1, notes: "400m" },
      ],
    },
  ]);

  const p1w5 = await createWorkoutWithBlocks(plan1.id, 5, "Day 5: Deadlift + Chipper", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Deadlift"]!, sets: 5, reps: 3, weightValue: 140, rpe: 9 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      timeCapSec: 1200,
      sets: [
        { exerciseId: exMap["Wall Ball"]!, reps: 50 },
        { exerciseId: exMap["Box Jump"]!, reps: 40 },
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 30 },
        { exerciseId: exMap["Burpee"]!, reps: 20 },
      ],
    },
  ]);

  const p2w1 = await createWorkoutWithBlocks(plan2.id, 1, "Monday: Strength Focus", [
    {
      categoryId: catMap["Warmup"]!,
      sets: [
        { exerciseId: exMap["PVC Pass-Through"]!, reps: 20 },
        { exerciseId: exMap["Arm Circles"]!, reps: 20 },
      ],
    },
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Back Squat"]!, sets: 5, reps: 5, weightValue: 80, rpe: 7 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 3,
      timeCapSec: 600,
      sets: [
        { exerciseId: exMap["Wall Ball"]!, reps: 15 },
        { exerciseId: exMap["Jump Rope"]!, reps: 50, notes: "Double unders" },
      ],
    },
  ]);

  const p2w2 = await createWorkoutWithBlocks(plan2.id, 2, "Tuesday: Conditioning", [
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 1200,
      sets: [
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "500m" },
        { exerciseId: exMap["Assault Bike"]!, reps: 1, notes: "20 cal" },
        { exerciseId: exMap["Running"]!, reps: 1, notes: "400m" },
      ],
    },
  ]);

  const p2w3 = await createWorkoutWithBlocks(plan2.id, 3, "Wednesday: Upper Body", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Bench Press"]!, sets: 4, reps: 8, weightValue: 60, rpe: 7 },
        { exerciseId: exMap["Overhead Press"]!, sets: 3, reps: 8, weightValue: 40, rpe: 6 },
      ],
    },
    {
      categoryId: catMap["Accessory"]!,
      sets: [
        { exerciseId: exMap["Tricep Pushdown"]!, sets: 3, reps: 12 },
        { exerciseId: exMap["Lateral Raise"]!, sets: 3, reps: 15 },
      ],
    },
  ]);

  const p2w4 = await createWorkoutWithBlocks(plan2.id, 4, "Thursday: Skill Day", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Clean & Jerk"]!, sets: 5, reps: 2, weightValue: 70, rpe: 7 },
        { exerciseId: exMap["Snatch"]!, sets: 5, reps: 2, weightValue: 50, rpe: 7 },
      ],
    },
  ]);

  const p3w1 = await createWorkoutWithBlocks(plan3.id, 1, "Intro: Movement Basics", [
    {
      categoryId: catMap["Warmup"]!,
      sets: [
        { exerciseId: exMap["Jumping Jacks"]!, reps: 30 },
        { exerciseId: exMap["Arm Circles"]!, reps: 20 },
        { exerciseId: exMap["PVC Pass-Through"]!, reps: 15 },
      ],
    },
    {
      categoryId: catMap["Strength"]!,
      sets: [
        {
          exerciseId: exMap["Back Squat"]!,
          sets: 3,
          reps: 10,
          weightValue: 40,
          rpe: 5,
          notes: "Focus on depth",
        },
        {
          exerciseId: exMap["Deadlift"]!,
          sets: 3,
          reps: 8,
          weightValue: 50,
          rpe: 5,
          notes: "Flat back",
        },
      ],
    },
  ]);

  const p3w2 = await createWorkoutWithBlocks(plan3.id, 2, "Day 2: Light Metcon", [
    {
      categoryId: catMap["Metcon"]!,
      rounds: 3,
      timeCapSec: 600,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 8 },
        { exerciseId: exMap["Box Jump"]!, reps: 10, notes: "Step-down option" },
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 12, weightValue: 16 },
      ],
    },
  ]);

  const p3w3 = await createWorkoutWithBlocks(plan3.id, 3, "Day 3: Cardio Base", [
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 1800,
      sets: [
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "2000m at easy pace" },
        { exerciseId: exMap["Jump Rope"]!, reps: 100, notes: "Singles OK" },
      ],
    },
  ]);

  await createWorkoutWithBlocks(plan4.id, 1, "Week 1 Day 1: Squat Focus", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Back Squat"]!, sets: 4, reps: 8, weightValue: 85, rpe: 7 },
        { exerciseId: exMap["Front Squat"]!, sets: 3, reps: 8, weightValue: 65, rpe: 7 },
      ],
    },
    {
      categoryId: catMap["Accessory"]!,
      sets: [
        { exerciseId: exMap["GHD Sit-Up"]!, sets: 3, reps: 20 },
        { exerciseId: exMap["Lateral Raise"]!, sets: 3, reps: 15 },
      ],
    },
  ]);

  await createWorkoutWithBlocks(plan5.id, 1, "Legacy Day 1", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Deadlift"]!, sets: 5, reps: 5, weightValue: 120 }],
    },
  ]);

  const p6w1 = await createWorkoutWithBlocks(plan6.id, 1, "Legacy Comp Day 1", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Back Squat"]!, sets: 5, reps: 3, weightValue: 110 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 5,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 10 },
        { exerciseId: exMap["Wall Ball"]!, reps: 15 },
      ],
    },
  ]);

  console.log("  Training plans: 6 (3 ACTIVE, 1 DRAFT, 2 ARCHIVED)");
  console.log("  Workouts: 15 with blocks and prescribed sets");

  return {
    plans: { plan1, plan2, plan3, plan4, plan5, plan6 },
    workouts: {
      p1: [p1w1, p1w2, p1w3, p1w4, p1w5],
      p2: [p2w1, p2w2, p2w3, p2w4],
      p3: [p3w1, p3w2, p3w3],
      p6: [p6w1],
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
        endDate: daysFromNow(5),
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
        endDate: daysFromNow(12),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan2.id,
        userId: users.lisa.id,
        startDate: daysAgo(10),
        endDate: daysFromNow(20),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan3.id,
        userId: users.david.id,
        startDate: daysAgo(5),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan3.id,
        userId: users.tom.id,
        startDate: daysAgo(3),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan6.id,
        userId: users.sarah.id,
        startDate: daysAgo(60),
        endDate: daysFromNow(10),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan5.id,
        userId: users.mike.id,
        startDate: daysAgo(100),
        endDate: daysAgo(30),
        status: PlanEnrollmentStatus.COMPLETED,
      },
      {
        trainingPlanId: plans.plan1.id,
        userId: users.alex.id,
        startDate: daysAgo(35),
        endDate: daysFromNow(25),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan2.id,
        userId: users.nina.id,
        startDate: daysAgo(25),
        endDate: daysFromNow(35),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan3.id,
        userId: users.chris.id,
        startDate: daysAgo(2),
        status: PlanEnrollmentStatus.ACTIVE,
      },
      {
        trainingPlanId: plans.plan2.id,
        userId: users.maria.id,
        startDate: daysAgo(6),
        endDate: daysFromNow(54),
        status: PlanEnrollmentStatus.ACTIVE,
      },
    ],
  });

  console.log("  Enrollments: 12 (10 active, 1 completed, 1 legacy-active)");
};

const seedWorkoutLogs = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  workouts: Awaited<ReturnType<typeof seedTrainingData>>["workouts"],
) => {
  const getPrescribedSets = async (workoutId: string) => {
    const blocks = await prisma.workoutBlock.findMany({
      where: { workoutId },
      include: { sets: true },
    });

    return blocks.flatMap((b) => b.sets);
  };

  const createLog = async (
    userId: string,
    workoutId: string,
    date: Date,
    isRx: boolean,
    notes: string | null,
    setOverrides?: { weightDone?: number; repsDone?: number; rpeActual?: number }[],
  ) => {
    const prescribed = await getPrescribedSets(workoutId);

    await prisma.workoutLog.create({
      data: {
        userId,
        workoutId,
        date,
        isRx,
        notes,
        createdAt: date,
        setLogs: {
          create: prescribed.map((ps, i) => ({
            prescribedSetId: ps.id,
            repsDone: setOverrides?.[i]?.repsDone ?? ps.reps ?? 10,
            weightDone:
              setOverrides?.[i]?.weightDone ?? (ps.weightValue ? Number(ps.weightValue) : null),
            rpeActual: setOverrides?.[i]?.rpeActual ?? ps.rpe,
          })),
        },
      },
    });
  };

  await createLog(users.sarah.id, workouts.p1[0]!.id, daysAgo(10), true, null, [
    { weightDone: 95, repsDone: 3, rpeActual: 7 },
    { weightDone: 75, repsDone: 5, rpeActual: 6 },
    { repsDone: 15, rpeActual: 8 },
    { repsDone: 12, rpeActual: 7 },
  ]);
  await createLog(users.sarah.id, workouts.p1[1]!.id, daysAgo(9), true, "Feeling strong on cleans");
  await createLog(users.sarah.id, workouts.p1[2]!.id, daysAgo(8), true, null);
  await createLog(users.sarah.id, workouts.p1[3]!.id, daysAgo(6), true, null, [
    { weightDone: 72, repsDone: 5, rpeActual: 7 },
    { weightDone: 52, repsDone: 6, rpeActual: 7 },
  ]);
  await createLog(users.sarah.id, workouts.p1[4]!.id, daysAgo(5), true, "PR on deadlift!", [
    { weightDone: 145, repsDone: 3, rpeActual: 9 },
  ]);
  await createLog(users.sarah.id, workouts.p1[0]!.id, daysAgo(3), true, null, [
    { weightDone: 100, repsDone: 3, rpeActual: 8 },
    { weightDone: 82, repsDone: 5, rpeActual: 7 },
  ]);
  await createLog(users.sarah.id, workouts.p1[1]!.id, daysAgo(2), true, null);
  await createLog(users.sarah.id, workouts.p1[2]!.id, daysAgo(1), true, null);
  await createLog(users.sarah.id, workouts.p1[3]!.id, todayAt(7, 30), true, "Morning session done");

  await createLog(users.jenny.id, workouts.p1[0]!.id, daysAgo(12), true, null);
  await createLog(users.jenny.id, workouts.p1[1]!.id, daysAgo(11), true, null);
  await createLog(users.jenny.id, workouts.p1[2]!.id, daysAgo(9), true, null);
  await createLog(users.jenny.id, workouts.p1[3]!.id, daysAgo(7), false, "Scaled overhead press", [
    { weightDone: 55, repsDone: 5, rpeActual: 8 },
    { weightDone: 35, repsDone: 6, rpeActual: 7 },
  ]);
  await createLog(users.jenny.id, workouts.p1[4]!.id, daysAgo(5), true, null);
  await createLog(users.jenny.id, workouts.p1[0]!.id, daysAgo(3), true, null);
  await createLog(users.jenny.id, workouts.p1[1]!.id, daysAgo(2), true, null);
  await createLog(users.jenny.id, workouts.p1[2]!.id, daysAgo(1), true, null);
  await createLog(users.jenny.id, workouts.p1[3]!.id, todayAt(8, 0), true, null);

  await createLog(users.mike.id, workouts.p2[0]!.id, daysAgo(20), true, null, [
    { weightDone: 90, repsDone: 5, rpeActual: 7 },
  ]);
  await createLog(users.mike.id, workouts.p2[1]!.id, daysAgo(19), true, null);
  await createLog(users.mike.id, workouts.p2[2]!.id, daysAgo(17), true, null);
  await createLog(users.mike.id, workouts.p2[3]!.id, daysAgo(15), true, null);
  await createLog(users.mike.id, workouts.p2[0]!.id, daysAgo(13), true, null, [
    { weightDone: 85, repsDone: 5, rpeActual: 8 },
  ]);
  await createLog(users.mike.id, workouts.p2[1]!.id, daysAgo(11), true, null);
  await createLog(users.mike.id, workouts.p2[2]!.id, daysAgo(9), true, null);
  await createLog(users.mike.id, workouts.p2[3]!.id, daysAgo(7), true, null);
  await createLog(
    users.mike.id,
    workouts.p2[0]!.id,
    daysAgo(4),
    true,
    "Last session before disappearing",
  );

  await createLog(users.lisa.id, workouts.p2[0]!.id, daysAgo(8), false, "Shoulder bothering me", [
    { weightDone: 50, repsDone: 5, rpeActual: 6 },
  ]);
  await createLog(
    users.lisa.id,
    workouts.p2[1]!.id,
    daysAgo(5),
    false,
    "Easy pace, shoulder recovery",
  );
  await createLog(users.lisa.id, workouts.p2[2]!.id, daysAgo(3), false, "Skipped overhead press", [
    { weightDone: 40, repsDone: 8, rpeActual: 5 },
    { weightDone: 0, repsDone: 0, rpeActual: 0 },
  ]);
  await createLog(
    users.lisa.id,
    workouts.p2[3]!.id,
    daysAgo(1),
    false,
    "Light technique work only",
  );

  await createLog(users.alex.id, workouts.p1[0]!.id, daysAgo(20), true, null);
  await createLog(users.alex.id, workouts.p1[1]!.id, daysAgo(18), true, null);
  await createLog(users.alex.id, workouts.p1[2]!.id, daysAgo(15), true, "Knee started hurting");
  await createLog(
    users.alex.id,
    workouts.p1[3]!.id,
    daysAgo(12),
    false,
    "Last session before injury",
  );

  await createLog(users.nina.id, workouts.p2[0]!.id, daysAgo(18), true, null);
  await createLog(users.nina.id, workouts.p2[1]!.id, daysAgo(16), true, null);
  await createLog(users.nina.id, workouts.p2[2]!.id, daysAgo(10), true, "Dropped off after this");

  console.log(
    "  Workout logs: 38 (Sarah 9, Jenny 9, Mike 9, Lisa 4, Alex 4, Nina 3, David 0, Tom 0, Chris 0, Maria 0)",
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
          "Discussed competition goals. She wants to qualify for Quarterfinals this year. Plan is on track — we might add a second daily session for skill work.",
        createdAt: daysAgo(1),
      },
      {
        coachId: coachProfileId,
        athleteId: users.mike.id,
        content:
          "Mike hasn't logged in 4 days. This is unusual — he was very consistent before. Need to reach out and check if everything is OK.",
        createdAt: daysAgo(2),
      },
      {
        coachId: coachProfileId,
        athleteId: users.lisa.id,
        content:
          "Lisa reported shoulder pain during overhead work. Set INJURY flag. She should avoid pressing movements and focus on lower body and cardio until cleared by her PT.",
        createdAt: daysAgo(5),
      },
      {
        coachId: coachProfileId,
        athleteId: users.lisa.id,
        content:
          "Spoke with Lisa about modifying her program. She's seeing a PT this week. In the meantime, substituting all overhead movements with landmine press and floor press.",
        createdAt: daysAgo(2),
      },
      {
        coachId: coachProfileId,
        athleteId: users.jenny.id,
        content:
          "Jenny crushed it today. Her consistency is paying off. She's ready to try ring muscle-ups next week.",
        createdAt: todayAt(9, 0),
      },
      {
        coachId: coachProfileId,
        athleteId: users.david.id,
        content:
          "New athlete David enrolled 5 days ago but hasn't started yet. Sent him a welcome message and walkthrough of how to access his first workout.",
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log("  Coach notes: 7");
};

const seedBenchmarks = async (users: Awaited<ReturnType<typeof seedUsers>>) => {
  const defs = await Promise.all([
    prisma.benchmarkDefinition.create({
      data: { name: "Back Squat 1RM", unit: "kg", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Deadlift 1RM", unit: "kg", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Clean & Jerk 1RM", unit: "kg", category: "Strength" },
    }),
    prisma.benchmarkDefinition.create({
      data: { name: "Snatch 1RM", unit: "kg", category: "Strength" },
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
      { userId: users.sarah.id, benchmarkDefinitionId: defs[0]!.id, value: 105 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[1]!.id, value: 140 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[2]!.id, value: 85 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[3]!.id, value: 65 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[4]!.id, value: 195 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[6]!.id, value: 22 },

      { userId: users.mike.id, benchmarkDefinitionId: defs[0]!.id, value: 140 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[1]!.id, value: 180 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[2]!.id, value: 110 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[5]!.id, value: 420 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[6]!.id, value: 30 },

      { userId: users.jenny.id, benchmarkDefinitionId: defs[0]!.id, value: 80 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[1]!.id, value: 100 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[4]!.id, value: 240 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[6]!.id, value: 15 },

      { userId: users.lisa.id, benchmarkDefinitionId: defs[0]!.id, value: 85 },
      { userId: users.lisa.id, benchmarkDefinitionId: defs[1]!.id, value: 110 },
      { userId: users.lisa.id, benchmarkDefinitionId: defs[5]!.id, value: 480 },
    ],
  });

  console.log("  Benchmarks: 7 definitions, 18 athlete records");
};

const seedMarketingPages = async () => {
  const pages = [
    {
      slug: "home",
      title: "Home Page",
      seoTitle: "The Discipline Program — Forging Elite Fitness",
      seoDesc: "High-performance coaching platform for CrossFit athletes.",
    },
    {
      slug: "about",
      title: "About Us",
      seoTitle: "About — The Discipline Program",
      seoDesc: "Meet Coach Ben. 10 years of coaching experience.",
    },
    {
      slug: "storefront",
      title: "Programs Storefront",
      seoTitle: "Programs — The Discipline Program",
      seoDesc: "Choose your training track.",
    },
    {
      slug: "blog",
      title: "The Whiteboard (Blog)",
      seoTitle: "The Whiteboard — Training Tips & Insights",
      seoDesc: "WOD tips, movement standards, nutrition advice.",
    },
    {
      slug: "contact",
      title: "Contact Us",
      seoTitle: "Contact — The Discipline Program",
      seoDesc: "Questions about programming? Get in touch.",
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
        title: "Forging Elite Discipline",
        subtitle: "Functional fitness for those who refuse to settle.",
        buttonText: "Start Training",
        buttonHref: "/storefront",
        backgroundImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      pageSlug: "home",
      section: "whyChoose",
      data: {
        title: "Why The Discipline Program?",
        subtitle: "Random workouts give random results.",
        features: [
          {
            id: "f1",
            title: "Constantly Varied",
            description: "Prepare for the unknown and unknowable.",
            iconName: "Shuffle",
          },
          {
            id: "f2",
            title: "High Intensity",
            description: "Maximize power output safely.",
            iconName: "Bolt",
          },
          {
            id: "f3",
            title: "Functional Movement",
            description: "Movements that build real strength.",
            iconName: "FitnessCenter",
          },
          {
            id: "f4",
            title: "Expert Coaching",
            description: "Every session designed by a certified coach.",
            iconName: "School",
          },
        ],
      },
    },
    {
      pageSlug: "home",
      section: "storefront",
      data: { title: "Choose Your Track", subtitle: "From Open preparation to daily GPP." },
    },
    {
      pageSlug: "home",
      section: "reviews",
      data: { title: "Community Results", subtitle: "Athletes hitting PRs every day." },
    },
    {
      pageSlug: "home",
      section: "contact",
      data: {
        title: "Join The Box",
        subtitle: "Questions? We're here to help.",
        buttonText: "Get In Touch",
        buttonHref: "/contact",
      },
    },
    {
      pageSlug: "about",
      section: "about:hero",
      data: {
        title: "Head Coach",
        subtitle: "10 years in the affiliate community.",
        buttonText: "Learn My Story",
        buttonHref: "#journey",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
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
            year: "2015",
            title: "First Competition",
            description: "Got destroyed at a local throwdown. That became fuel.",
          },
          {
            year: "2016",
            title: "First Certification",
            description: "Earned L1 and started coaching.",
          },
          { year: "2019", title: "Regionals", description: "Qualified as an individual athlete." },
          {
            year: "2023",
            title: "The Discipline Program",
            description: "Launched the online platform.",
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
          { title: "CrossFit Level 3 (CCFT)", description: "Highest individual credential." },
          { title: "USA Weightlifting Level 1", description: "Sports Performance Coach." },
          { title: "Burgener Strength", description: "Weightlifting Staff certification." },
          { title: "Precision Nutrition L1", description: "Evidence-based nutrition coaching." },
        ],
      },
    },
    {
      pageSlug: "about",
      section: "personal",
      data: {
        title: "Outside The Box",
        description: "Trail running and grilling protein.",
        image:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        name: "Denis Sergeev",
        role: "Head Coach & Founder",
      },
    },
    {
      pageSlug: "about",
      section: "cta",
      data: {
        title: "3... 2... 1... GO!",
        subtitle: "The clock is ticking.",
        buttonText: "Join The Program",
        buttonHref: "/storefront",
      },
    },
    {
      pageSlug: "storefront",
      section: "storefront:hero",
      data: {
        title: "Programming Tracks",
        subtitle: "Structured paths for every level.",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      pageSlug: "storefront",
      section: "storefront:cta",
      data: {
        title: "Ready to Transform?",
        subtitle: "Join 100+ athletes.",
        buttonText: "Start Your Journey",
        buttonHref: "/contact",
      },
    },
    {
      pageSlug: "blog",
      section: "blog:hero",
      data: {
        title: "The Whiteboard",
        subtitle: "WOD tips and nutrition advice.",
        backgroundImage:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      pageSlug: "contact",
      section: "contact:hero",
      data: { title: "Drop Us A Line", subtitle: "We love talking shop." },
    },
    {
      pageSlug: "contact",
      section: "form",
      data: { title: "Get in Touch", subtitle: "Let us know how we can help." },
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
              "Yes, you'll need access to a barbell, plates, pull-up bar, and conditioning equipment.",
          },
          {
            question: "How long are the daily sessions?",
            answer: "Foundations: 45min, Performance RX: 60min, Competitor: 90-120min.",
          },
          {
            question: "Can I switch between tracks?",
            answer: "Yes, any time. We recommend at least 4 weeks before switching.",
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
      description: "High-volume programming for Open/Quarterfinals. Two sessions per day.",
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
        "Daily WOD programming. 60-minute sessions combining strength, skill, and conditioning.",
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
        "General Physical Preparedness for new athletes. Movement quality and base building.",
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
      description: "Smart programming for athletes over 40. Modified volume and recovery focus.",
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
          '## The Problem\n\nThe bar muscle-up is the gateway to high-level gymnastics work. Most athletes approach it wrong — trying to muscle through instead of understanding mechanics.\n\n## Technical Breakdown\n\n### 1. The Pull Phase\nYour pull must be explosive and vertical. Think "chest to bar" on steroids.\n\n**Key cue:** "Pull the bar to your hips, not your chin."\n\n### 2. The Transition\nAs you reach peak height, aggressively push your hands away while leaning forward over the bar.\n\n**Key cue:** "Sit up fast — like you\'re getting out of bed late."\n\n### 3. The Dip\nOnce your hips are against the bar, finish with a strong press. Lock out fully.\n\n## 8-Week Progression\n\n- **Weeks 1-2:** High pull-ups with chest clearance focus\n- **Weeks 3-4:** Hollow body drills + explosive chest-to-bar\n- **Weeks 5-6:** Banded transitions\n- **Weeks 7-8:** Volume work, singles and doubles',
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
      {
        slug: "pre-workout-nutrition-timing",
        title: "Pre-Workout Nutrition: When and What to Eat Before Training",
        excerpt: "Science-backed meal timing strategies for optimal performance.",
        content:
          "## Why Timing Matters\n\nYour body needs 2-3 hours to digest a full meal.\n\n## The 3-Hour Window\n6oz protein + 1 cup carbs + vegetables. ~40g protein / ~50g carbs / ~15g fat.\n\n## The 60-90 Minute Window\nBanana with almond butter, rice cakes with honey, Greek yogurt with berries.\n\n## Post-Workout\nWithin 60 minutes: 30-40g protein + 40-60g fast carbs + rehydrate.",
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
      {
        slug: "mental-game-of-amraps",
        title: "The Mental Game of AMRAPs: Pacing, Pain, and Strategy",
        excerpt: "How to pace, when to push, and the psychological warfare of AMRAP workouts.",
        content:
          "## AMRAPs Are Mind Games\n\n12 minutes. No prescribed rounds. No finish line.\n\n## The Pacing Formula\n- **First third:** 70-75% effort\n- **Middle third:** 80-85% effort\n- **Final third:** 90-100% effort\n\n## The Final 60 Seconds\nCount the seconds. Make every rep deliberate. The pain is temporary. Your score is permanent.",
        coverImage:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
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
          '## The Biggest Mistake\n\n"I\'ll just do an active recovery WOD on my rest day." No. Rest means rest.\n\n## The Science of Supercompensation\n1. Training stimulus → break down\n2. Fatigue → immediately weaker\n3. Recovery → repair over 24-72h\n4. Supercompensation → rebuild stronger\n\nYou only get step 4 if you actually rest.',
        coverImage:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
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
        excerpt: "Why being flexible doesn't mean you're mobile — and why it matters for snatches.",
        content:
          "## Flexibility: Passive Range\nHow far a joint moves with external force.\n\n## Mobility: Active Control\nHow far a joint moves under your own muscular control, under load.\n\n## The 15-Minute Daily Routine\n1. Deep squat hold — 2 min\n2. PVC pass-throughs — 20 reps\n3. Active leg raises — 10 each\n4. Thoracic rotations — 10 each\n5. Ankle dorsiflexion — 2 min/side",
        coverImage:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
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
        excerpt: "Simple coaching cues that fix snatch and clean technique instantly.",
        content:
          '## Cue 1: "Push The Floor Away"\nEngages legs first, maintains back angle.\n\n## Cue 2: "Patience Off The Floor"\nControlled first pull → explosive second pull.\n\n## Cue 3: "Elbows High and Outside"\nFast elbows = fast turnover in the clean.\n\n## Cue 4: "Meet The Bar"\nActively pull yourself under.\n\n## Cue 5: "Punch To The Ceiling"\nActive shoulder engagement overhead.',
        coverImage:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
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
          "## The Framework\n\nPeaking requires periodized programming.\n\n## Phase 1: Volume (Weeks 12-9)\nBuild work capacity and address weaknesses.\n\n## Phase 2: Intensity (Weeks 8-5)\nConvert volume into power output.\n\n## Phase 3: Taper (Weeks 4-1)\nReduce volume by 30-40%, maintain intensity.\n\n[Competition week section in progress]",
        coverImage: null,
        authorName: "Coach Ben",
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
        excerpt: "Evidence-based protein intake recommendations. Cut through the bro-science.",
        content:
          "## The Short Answer\n\n**1.6-2.2 grams per kilogram of bodyweight per day.**\n\nFor a 75kg athlete: 120-165g daily.\n\n## Protein Timing\nTotal daily intake > timing. But eating within 2 hours of training helps.\n\n## Best Sources\nChicken breast (31g/100g), salmon (25g), lean beef (26g), eggs (6g each), Greek yogurt (15-20g/cup).",
        coverImage:
          "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=1200&q=80",
        authorName: "Coach Ben",
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
        authorRole: "Regional Athlete",
        text: "I've been following The Competitor track for 6 months. PRs on clean & jerk (+15kg), bar muscle-ups from 10 to 25 unbroken, and qualified for Quarterfinals. Worth every penny.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(38),
      },
      {
        authorName: "Mike Thompson",
        authorRole: "Performance RX Member",
        text: "Best programming I've ever followed. Daily WODs are perfectly balanced. Hitting PRs consistently and my engine has never been better.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(31),
      },
      {
        authorName: "Jennifer Park",
        authorRole: "Garage Gym Athlete",
        text: "After my local box closed, I thought my CrossFit days were over. Foundations GPP gave me the structure I needed for solo training.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(25),
      },
      {
        authorName: "David Rodriguez",
        authorRole: "Comeback Athlete",
        text: "Took 2 years off. Coming back at 38 was humbling, but Foundations has been perfect for rebuilding. Movements are scalable, volume is reasonable.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(19),
      },
      {
        authorName: "Emma Lawson",
        authorRole: "Open Competitor",
        text: "The Competitor track is absolutely brutal in the best way. Finished top 500 worldwide in the Open this year.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(16),
      },
      {
        authorName: "Lisa Anderson",
        authorRole: "Masters 45-49",
        text: "My joints feel better than 5 years ago, and I'm stronger. Highly recommend for Masters athletes.",
        rating: 5,
        isActive: true,
        createdAt: daysAgo(12),
      },
      {
        authorName: "Tom Bradley",
        authorRole: "Weekend Warrior",
        text: "Great programming for someone who can't commit to 5-6 days. Deadlift up 30lbs in 3 months and first strict pull-up.",
        rating: 4,
        isActive: true,
        createdAt: daysAgo(8),
      },
      {
        authorName: "Anonymous",
        authorRole: null,
        text: "Decent programming but pacing too slow for my level. Switched after 2 months.",
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
        name: "Alex Chen",
        email: "alex.chen@email.com",
        program: "The Competitor",
        message:
          "I'm training for the Open. How does The Competitor compare to a competitive affiliate?",
        status: "NEW",
        createdAt: daysAgo(1),
      },
      {
        name: "Rachel Martinez",
        email: "rachel.m@email.com",
        program: "Foundations GPP",
        message:
          "I have a garage gym with barbell, plates, pull-up bar, and rings. Will Foundations work?",
        status: "NEW",
        createdAt: daysAgo(2),
      },
      {
        name: "Patricia Johnson",
        email: "patricia.j@email.com",
        program: "Masters 40+",
        message:
          "I'm 52. Is the Masters 40+ program coming back? Or would Performance RX with scaling work?",
        status: "NEW",
        createdAt: daysAgo(4),
      },
      {
        name: "Mark Sullivan",
        email: "mark.sullivan@email.com",
        message: "Do you offer annual discounts? Also curious about family plans.",
        status: "IN_PROGRESS",
        notes: "Sent annual pricing. Waiting for reply.",
        createdAt: daysAgo(5),
      },
      {
        name: "Sophie Williams",
        email: "sophie.w@email.com",
        program: "Performance RX",
        message: "Signed up yesterday but training section is empty. Can someone help?",
        status: "IN_PROGRESS",
        notes: "Subscription sync issue. Checking webhook logs.",
        createdAt: daysAgo(3),
      },
      {
        name: "Brian Foster",
        email: "brian.foster@email.com",
        program: "Foundations GPP",
        message: "6 weeks into Foundations and loving it. When should I move to Performance RX?",
        status: "REPLIED",
        notes: "Stay on Foundations 2 more weeks until 5 strict pull-ups.",
        createdAt: daysAgo(11),
      },
      {
        name: "Christina Lee",
        email: "christina.lee@email.com",
        program: "Performance RX",
        message: "Dealing with rotator cuff tendinitis. Are there built-in substitutions?",
        status: "REPLIED",
        notes: "Advised PT first. Sent overhead substitutions list.",
        createdAt: daysAgo(15),
      },
      {
        name: "Jason Miller",
        email: "jason.m@email.com",
        program: "The Competitor",
        message: "Hit a 20lb PR on back squat and qualified for Quarterfinals. Thanks!",
        status: "CLOSED",
        notes: "Success story. Added to testimonials list.",
        createdAt: daysAgo(18),
      },
      {
        name: "Kevin Davis",
        email: "kevin@crossfitcentral.com",
        message: "I run a CrossFit affiliate. Interested in bulk licensing or partnerships.",
        status: "CLOSED",
        notes: "Not ready for affiliates yet. Revisit Q3.",
        createdAt: daysAgo(14),
      },
      {
        name: "Nicole Anderson",
        email: "nicole.a@email.com",
        program: "Foundations GPP",
        message: "Do you have a mobile app? I'd love to log workouts from my phone.",
        status: "CLOSED",
        notes: "PWA in development. She signed up anyway.",
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
  const coachProfile = await seedProfiles(users);
  const { catMap, exMap } = await seedExercises();
  const { plans, workouts } = await seedTrainingData(coachProfile.id, catMap, exMap);

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
  console.log("  Coach:   coach.ben@thedisciplineprogram.com / password123");
  console.log("  Athlete: sarah.mitchell@email.com / password123");
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
