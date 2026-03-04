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
        timezone: "Europe/Kyiv",
        createdAt: daysAgo(90),
      },
    }),
    prisma.user.create({
      data: {
        email: "coach.ben@thedisciplineprogram.com",
        name: "Ben Sergeev",
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

  console.log("  Profiles: 1 coach, 10 athletes (1 INJURED, 1 RESTRICTED, 8 HEALTHY)");

  return { coachProfile };
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
  const createWorkout = async (
    planId: string,
    scheduledDate: Date | null,
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
      data: { planId, scheduledDate, title, createdAt: daysAgo(30) },
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
      name: "Foundations Daily",
      description:
        "General Physical Preparedness for new athletes. Emphasis on movement quality and building base.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(35),
    },
  });

  const plan4 = await prisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: "Strength Block",
      description:
        "4-week hypertrophy cycle. Heavy barbell work with scheduled rest days. No today workout — rest day.",
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

  const p1w1 = await createWorkout(plan1.id, daysAgo(14), "Day 1: Heavy Squats + Sprint", [
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

  const p1w2 = await createWorkout(plan1.id, daysAgo(12), "Day 2: Olympic Lifting", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Clean & Jerk"]!, sets: 5, reps: 2, weightValue: 85, rpe: 9 },
        { exerciseId: exMap["Snatch"]!, sets: 5, reps: 2, weightValue: 65, rpe: 8 },
      ],
    },
  ]);

  const p1w3 = await createWorkout(plan1.id, daysAgo(10), "Day 3: Gymnastics + Metcon", [
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
      ],
    },
  ]);

  const p1w4 = await createWorkout(plan1.id, daysAgo(7), "Day 4: Pressing + Cardio", [
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

  const p1w5 = await createWorkout(plan1.id, daysAgo(5), "Day 5: Deadlift + Chipper", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Deadlift"]!, sets: 5, reps: 3, weightValue: 140, rpe: 9 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      timeCapSec: 1200,
      sets: [
        { exerciseId: exMap["Wall Ball"]!, reps: 50 },
        { exerciseId: exMap["Burpee"]!, reps: 20 },
      ],
    },
  ]);

  const p1w6 = await createWorkout(plan1.id, daysAgo(3), "Day 6: Olympic Repeat", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Clean & Jerk"]!, sets: 5, reps: 2, weightValue: 90, rpe: 8 },
        { exerciseId: exMap["Snatch"]!, sets: 5, reps: 2, weightValue: 70, rpe: 8 },
      ],
    },
  ]);

  const p1w7 = await createWorkout(plan1.id, daysAgo(1), "Day 7: Gymnastics Volume", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Bar Muscle-Up"]!, sets: 8, reps: 2 },
        { exerciseId: exMap["Ring Muscle-Up"]!, sets: 4, reps: 2 },
      ],
    },
  ]);

  const p1w8 = await createWorkout(plan1.id, todayAt(0), "Day 8: Squat + Sprint", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Back Squat"]!, sets: 5, reps: 3, weightValue: 105, rpe: 9 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 4,
      timeCapSec: 600,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 10 },
        { exerciseId: exMap["Box Jump"]!, reps: 12 },
      ],
    },
  ]);

  const p2w1 = await createWorkout(plan2.id, daysAgo(14), "Monday: Strength Focus", [
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

  const p2w2 = await createWorkout(plan2.id, daysAgo(12), "Tuesday: Conditioning", [
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

  const p2w3 = await createWorkout(plan2.id, daysAgo(10), "Wednesday: Upper Body", [
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

  const p2w4 = await createWorkout(plan2.id, daysAgo(7), "Thursday: Skill Day", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Clean & Jerk"]!, sets: 5, reps: 2, weightValue: 70, rpe: 7 },
        { exerciseId: exMap["Snatch"]!, sets: 5, reps: 2, weightValue: 50, rpe: 7 },
      ],
    },
  ]);

  const p2w5 = await createWorkout(plan2.id, daysAgo(5), "Friday: Deadlift + Metcon", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Deadlift"]!, sets: 5, reps: 5, weightValue: 100, rpe: 8 }],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 4,
      timeCapSec: 900,
      sets: [
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 20 },
        { exerciseId: exMap["Box Jump"]!, reps: 15 },
      ],
    },
  ]);

  const p2w6 = await createWorkout(plan2.id, daysAgo(3), "Saturday: Team Metcon", [
    {
      categoryId: catMap["Metcon"]!,
      rounds: 5,
      timeCapSec: 1200,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 12 },
        { exerciseId: exMap["Wall Ball"]!, reps: 15 },
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "250m" },
      ],
    },
  ]);

  const p2w7 = await createWorkout(plan2.id, daysAgo(1), "Monday: Squat Repeat", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Back Squat"]!, sets: 5, reps: 5, weightValue: 85, rpe: 8 }],
    },
  ]);

  const p2w8 = await createWorkout(plan2.id, todayAt(0), "Tuesday: Conditioning Day", [
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 1800,
      sets: [
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "2000m" },
        { exerciseId: exMap["Assault Bike"]!, reps: 1, notes: "40 cal" },
      ],
    },
    {
      categoryId: catMap["Metcon"]!,
      rounds: 3,
      sets: [
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 15 },
        { exerciseId: exMap["Jump Rope"]!, reps: 50 },
      ],
    },
  ]);

  const p3w1 = await createWorkout(plan3.id, daysAgo(7), "Intro: Movement Basics", [
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
        { exerciseId: exMap["Back Squat"]!, sets: 3, reps: 10, weightValue: 40, rpe: 5 },
        { exerciseId: exMap["Deadlift"]!, sets: 3, reps: 8, weightValue: 50, rpe: 5 },
      ],
    },
  ]);

  const p3w2 = await createWorkout(plan3.id, daysAgo(5), "Day 2: Light Metcon", [
    {
      categoryId: catMap["Metcon"]!,
      rounds: 3,
      timeCapSec: 600,
      sets: [
        { exerciseId: exMap["Burpee"]!, reps: 8 },
        { exerciseId: exMap["Box Jump"]!, reps: 10 },
        { exerciseId: exMap["Kettlebell Swing"]!, reps: 12, weightValue: 16 },
      ],
    },
  ]);

  const p3w3 = await createWorkout(plan3.id, daysAgo(3), "Day 3: Cardio Base", [
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 1800,
      sets: [
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "2000m at easy pace" },
        { exerciseId: exMap["Jump Rope"]!, reps: 100 },
      ],
    },
  ]);

  const p3w4 = await createWorkout(plan3.id, todayAt(0), "Day 4: Upper Body Intro", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Bench Press"]!, sets: 3, reps: 8, weightValue: 30, rpe: 5 },
        { exerciseId: exMap["Overhead Press"]!, sets: 3, reps: 8, weightValue: 20, rpe: 5 },
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

  const p4w1 = await createWorkout(plan4.id, daysAgo(21), "Week 1: Squat Focus", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Back Squat"]!, sets: 4, reps: 8, weightValue: 85, rpe: 7 },
        { exerciseId: exMap["Front Squat"]!, sets: 3, reps: 8, weightValue: 65, rpe: 7 },
      ],
    },
  ]);

  const p4w2 = await createWorkout(plan4.id, daysAgo(14), "Week 2: Deadlift Focus", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Deadlift"]!, sets: 5, reps: 5, weightValue: 120, rpe: 8 },
        { exerciseId: exMap["GHD Sit-Up"]!, sets: 3, reps: 20 },
      ],
    },
  ]);

  const p4w3 = await createWorkout(plan4.id, daysAgo(10), "Week 3: Press Focus", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Bench Press"]!, sets: 5, reps: 5, weightValue: 70, rpe: 7 },
        { exerciseId: exMap["Overhead Press"]!, sets: 4, reps: 6, weightValue: 50, rpe: 7 },
      ],
    },
  ]);

  const p4w4 = await createWorkout(plan4.id, daysAgo(5), "Week 4 Day 1: Heavy Squat", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Back Squat"]!, sets: 5, reps: 3, weightValue: 100, rpe: 8 }],
    },
  ]);

  const p4w5 = await createWorkout(plan4.id, daysAgo(3), "Week 4 Day 2: Heavy Deadlift", [
    {
      categoryId: catMap["Strength"]!,
      sets: [{ exerciseId: exMap["Deadlift"]!, sets: 5, reps: 3, weightValue: 140, rpe: 9 }],
    },
  ]);

  const p4w6 = await createWorkout(plan4.id, daysAgo(2), "Week 4 Day 3: Heavy Press", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Bench Press"]!, sets: 5, reps: 3, weightValue: 80, rpe: 8 },
        { exerciseId: exMap["Overhead Press"]!, sets: 4, reps: 4, weightValue: 55, rpe: 8 },
      ],
    },
  ]);

  const p4w7 = await createWorkout(plan4.id, daysAgo(1), "Week 4 Day 4: Accessory", [
    {
      categoryId: catMap["Accessory"]!,
      sets: [
        { exerciseId: exMap["GHD Sit-Up"]!, sets: 4, reps: 15 },
        { exerciseId: exMap["Lateral Raise"]!, sets: 4, reps: 12 },
        { exerciseId: exMap["Tricep Pushdown"]!, sets: 4, reps: 12 },
      ],
    },
  ]);

  await createWorkout(plan5.id, null, "Assessment: Barbell Basics", [
    {
      categoryId: catMap["Strength"]!,
      sets: [
        { exerciseId: exMap["Back Squat"]!, sets: 3, reps: 5, notes: "Find working weight" },
        { exerciseId: exMap["Deadlift"]!, sets: 3, reps: 5, notes: "Find working weight" },
      ],
    },
  ]);

  await createWorkout(plan5.id, null, "Assessment: Conditioning", [
    {
      categoryId: catMap["Cardio"]!,
      timeCapSec: 600,
      sets: [
        { exerciseId: exMap["Rowing"]!, reps: 1, notes: "500m max effort" },
        { exerciseId: exMap["Assault Bike"]!, reps: 1, notes: "15 cal max effort" },
      ],
    },
  ]);

  await createWorkout(plan5.id, null, "Assessment: Gymnastics", [
    {
      categoryId: catMap["Skill"]!,
      sets: [
        { exerciseId: exMap["Bar Muscle-Up"]!, sets: 3, reps: 1, notes: "Test max reps" },
        { exerciseId: exMap["Handstand Walk"]!, sets: 3, reps: 1, notes: "Test max distance" },
      ],
    },
  ]);

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

  await createLog(users.sarah.id, workouts.p1[0]!.id, daysAgo(14), true, null, [
    { weightDone: 95, repsDone: 3, rpeActual: 7 },
    { weightDone: 75, repsDone: 5, rpeActual: 6 },
    { repsDone: 15, rpeActual: 8 },
    { repsDone: 12, rpeActual: 7 },
  ]);
  await createLog(
    users.sarah.id,
    workouts.p1[1]!.id,
    daysAgo(12),
    true,
    "Feeling strong on cleans",
  );
  await createLog(users.sarah.id, workouts.p1[2]!.id, daysAgo(10), true, null);
  await createLog(users.sarah.id, workouts.p1[3]!.id, daysAgo(7), true, null);
  await createLog(users.sarah.id, workouts.p1[4]!.id, daysAgo(5), true, "PR on deadlift!", [
    { weightDone: 145, repsDone: 3, rpeActual: 9 },
  ]);
  await createLog(users.sarah.id, workouts.p1[5]!.id, daysAgo(3), true, null);
  await createLog(users.sarah.id, workouts.p1[6]!.id, daysAgo(1), true, null);
  await createLog(users.sarah.id, workouts.p1[7]!.id, todayAt(7, 30), true, "Morning session done");

  await createLog(users.jenny.id, workouts.p1[0]!.id, daysAgo(14), true, null);
  await createLog(users.jenny.id, workouts.p1[1]!.id, daysAgo(12), true, null);
  await createLog(users.jenny.id, workouts.p1[2]!.id, daysAgo(10), true, null);
  await createLog(users.jenny.id, workouts.p1[3]!.id, daysAgo(7), false, "Scaled overhead press");
  await createLog(users.jenny.id, workouts.p1[4]!.id, daysAgo(5), true, null);
  await createLog(users.jenny.id, workouts.p1[5]!.id, daysAgo(3), true, null);
  await createLog(users.jenny.id, workouts.p1[6]!.id, daysAgo(1), true, null);
  await createLog(users.jenny.id, workouts.p1[7]!.id, todayAt(8, 0), true, null);

  await createLog(users.mike.id, workouts.p2[0]!.id, daysAgo(14), true, null);
  await createLog(users.mike.id, workouts.p2[1]!.id, daysAgo(12), true, null);
  await createLog(users.mike.id, workouts.p2[2]!.id, daysAgo(10), true, null);
  await createLog(users.mike.id, workouts.p2[3]!.id, daysAgo(7), true, null);
  await createLog(users.mike.id, workouts.p2[4]!.id, daysAgo(5), true, null);
  await createLog(users.mike.id, workouts.p2[5]!.id, daysAgo(3), true, null);
  await createLog(users.mike.id, workouts.p2[6]!.id, daysAgo(1), true, null);

  await createLog(users.maria.id, workouts.p2[0]!.id, daysAgo(14), true, null);
  await createLog(users.maria.id, workouts.p2[1]!.id, daysAgo(12), true, null);
  await createLog(users.maria.id, workouts.p2[2]!.id, daysAgo(10), true, null);
  await createLog(users.maria.id, workouts.p2[3]!.id, daysAgo(7), true, null);
  await createLog(users.maria.id, workouts.p2[4]!.id, daysAgo(5), true, null);
  await createLog(users.maria.id, workouts.p2[5]!.id, daysAgo(3), true, null);
  await createLog(users.maria.id, workouts.p2[6]!.id, daysAgo(1), true, null);
  await createLog(users.maria.id, workouts.p2[7]!.id, todayAt(6, 15), true, "Early bird done");

  await createLog(users.david.id, workouts.p3[0]!.id, daysAgo(4), true, "First workout ever");
  await createLog(users.david.id, workouts.p3[1]!.id, daysAgo(2), true, null);

  await createLog(users.alex.id, workouts.p4[0]!.id, daysAgo(21), true, null);
  await createLog(users.alex.id, workouts.p4[1]!.id, daysAgo(14), true, "Knee started hurting");

  await createLog(users.lisa.id, workouts.p4[0]!.id, daysAgo(21), false, null);
  await createLog(users.lisa.id, workouts.p4[1]!.id, daysAgo(14), false, "Shoulder pain");
  await createLog(users.lisa.id, workouts.p4[2]!.id, daysAgo(10), false, "Light weights only");
  await createLog(users.lisa.id, workouts.p4[3]!.id, daysAgo(5), false, "Last session before rest");

  await createLog(users.nina.id, workouts.p4[0]!.id, daysAgo(21), true, null);
  await createLog(users.nina.id, workouts.p4[1]!.id, daysAgo(14), true, null);
  await createLog(users.nina.id, workouts.p4[2]!.id, daysAgo(10), true, "Dropped off after this");

  console.log(
    "  Workout logs: Sarah 8, Jenny 8, Mike 7, Maria 8, David 2, Alex 2, Lisa 4, Nina 3 (Tom 0, Chris 0)",
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
        createdAt: todayAt(9, 0),
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
          "## The Problem\n\nThe bar muscle-up is the gateway to high-level gymnastics work.\n\n## Technical Breakdown\n\n### 1. The Pull Phase\nYour pull must be explosive and vertical.\n\n### 2. The Transition\nAs you reach peak height, push your hands away while leaning forward.\n\n### 3. The Dip\nFinish with a strong press. Lock out fully.\n\n## 8-Week Progression\n\n- **Weeks 1-2:** High pull-ups with chest clearance focus\n- **Weeks 3-4:** Hollow body drills + explosive chest-to-bar\n- **Weeks 5-6:** Banded transitions\n- **Weeks 7-8:** Volume work, singles and doubles",
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
          "## Why Timing Matters\n\nYour body needs 2-3 hours to digest a full meal.\n\n## The 3-Hour Window\n6oz protein + 1 cup carbs + vegetables.\n\n## Post-Workout\nWithin 60 minutes: 30-40g protein + 40-60g fast carbs.",
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
          "## AMRAPs Are Mind Games\n\n12 minutes. No prescribed rounds.\n\n## The Pacing Formula\n- **First third:** 70-75% effort\n- **Middle third:** 80-85% effort\n- **Final third:** 90-100% effort",
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
          '## The Biggest Mistake\n\n"I\'ll just do an active recovery WOD." No. Rest means rest.\n\n## The Science of Supercompensation\n1. Training stimulus\n2. Fatigue\n3. Recovery\n4. Supercompensation',
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
          "## Flexibility: Passive Range\nHow far a joint moves with external force.\n\n## Mobility: Active Control\nHow far a joint moves under your own control, under load.\n\n## The 15-Minute Daily Routine\n1. Deep squat hold\n2. PVC pass-throughs\n3. Active leg raises\n4. Thoracic rotations\n5. Ankle dorsiflexion",
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
          '## Cue 1: "Push The Floor Away"\n## Cue 2: "Patience Off The Floor"\n## Cue 3: "Elbows High and Outside"\n## Cue 4: "Meet The Bar"\n## Cue 5: "Punch To The Ceiling"',
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
          "## The Framework\n\nPeaking requires periodized programming.\n\n## Phase 1: Volume (Weeks 12-9)\n## Phase 2: Intensity (Weeks 8-5)\n## Phase 3: Taper (Weeks 4-1)\n\n[Competition week section in progress]",
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
        excerpt: "Evidence-based protein intake recommendations.",
        content:
          "## The Short Answer\n\n**1.6-2.2 grams per kilogram of bodyweight per day.**\n\n## Protein Timing\nTotal daily intake > timing.\n\n## Best Sources\nChicken breast (31g/100g), salmon (25g), lean beef (26g), eggs (6g each).",
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
        text: "Took 2 years off. Coming back at 38 was humbling, but Foundations has been perfect for rebuilding.",
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
        text: "Great programming for someone who can't commit to 5-6 days. Deadlift up 30lbs in 3 months.",
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
        message: "I'm 52. Is the Masters 40+ program coming back?",
        status: "NEW",
        createdAt: daysAgo(4),
      },
      {
        name: "Mark Sullivan",
        email: "mark.sullivan@email.com",
        message: "Do you offer annual discounts?",
        status: "IN_PROGRESS",
        notes: "Sent annual pricing. Waiting for reply.",
        createdAt: daysAgo(5),
      },
      {
        name: "Sophie Williams",
        email: "sophie.w@email.com",
        program: "Performance RX",
        message: "Signed up yesterday but training section is empty.",
        status: "IN_PROGRESS",
        notes: "Subscription sync issue.",
        createdAt: daysAgo(3),
      },
      {
        name: "Brian Foster",
        email: "brian.foster@email.com",
        program: "Foundations GPP",
        message: "6 weeks into Foundations and loving it. When should I move to Performance RX?",
        status: "REPLIED",
        notes: "Stay on Foundations 2 more weeks.",
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
        notes: "Success story.",
        createdAt: daysAgo(18),
      },
      {
        name: "Kevin Davis",
        email: "kevin@crossfitcentral.com",
        message: "I run a CrossFit affiliate. Interested in bulk licensing.",
        status: "CLOSED",
        notes: "Not ready for affiliates yet.",
        createdAt: daysAgo(14),
      },
      {
        name: "Nicole Anderson",
        email: "nicole.a@email.com",
        program: "Foundations GPP",
        message: "Do you have a mobile app?",
        status: "CLOSED",
        notes: "PWA in development.",
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
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
