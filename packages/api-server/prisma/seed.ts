import {
  Gender,
  PlanEnrollmentStatus,
  PrismaClient,
  type Prisma,
  Role,
  ScoreType,
  SectionType,
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

type SetConfig = {
  exerciseId: string;
  reps?: number;
  weightValue?: number;
  weightUnit?: Unit;
  weightType?: "ABSOLUTE" | "PERCENTAGE";
  rpe?: number;
  notes?: string;
  sortOrder?: number;
};

type BlockConfig = {
  sectionType: SectionType;
  scoreType: ScoreType;
  title?: string;
  notes?: string;
  categoryId?: string;
  rounds?: number;
  timeCapSec?: number;
  intervalSec?: number;
  workSec?: number;
  restSec?: number;
  restAfterSec?: number;
  sets: SetConfig[];
};

const block = (
  sectionType: SectionType,
  scoreType: ScoreType,
  title: string,
  sets: SetConfig[],
  opts?: Omit<BlockConfig, "sectionType" | "scoreType" | "title" | "sets">,
): BlockConfig => ({ sectionType, scoreType, title, sets, ...opts });

const set = (
  exerciseId: string,
  reps?: number,
  weightValue?: number,
  opts?: Partial<Pick<SetConfig, "weightUnit" | "weightType" | "rpe" | "notes">>,
): SetConfig => ({
  exerciseId,
  reps,
  weightValue,
  weightUnit: opts?.weightUnit ?? Unit.LB,
  ...opts,
});

const repeat = (
  n: number,
  exerciseId: string,
  reps?: number,
  weightValue?: number,
  opts?: Partial<Pick<SetConfig, "weightUnit" | "weightType" | "rpe" | "notes">>,
): SetConfig[] => Array.from({ length: n }, () => set(exerciseId, reps, weightValue, opts));

const wave = (
  exerciseId: string,
  reps: number,
  weights: number[],
  opts?: Partial<Pick<SetConfig, "weightUnit" | "weightType" | "rpe" | "notes">>,
): SetConfig[] => weights.map((w) => set(exerciseId, reps, w, opts));

type ExMap = Record<string, string>;

const clearAll = async () => {
  await prisma.blockScore.deleteMany();
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

const EXERCISES: Record<string, string[]> = {
  Weightlifting: [
    "Back Squat",
    "Front Squat",
    "Deadlift",
    "Clean",
    "Power Clean",
    "Clean & Jerk",
    "Snatch",
    "Power Snatch",
    "Overhead Squat",
    "Thruster",
    "Sumo Deadlift High Pull",
    "Push Press",
    "Push Jerk",
    "Split Jerk",
    "Bench Press",
  ],
  Gymnastics: [
    "Pull-Up",
    "Chest-to-Bar Pull-Up",
    "Bar Muscle-Up",
    "Ring Muscle-Up",
    "Handstand Push-Up",
    "Handstand Walk",
    "Toes-to-Bar",
    "Rope Climb",
    "Ring Dip",
    "Pistol Squat",
  ],
  Monostructural: ["Row", "Assault Bike", "Ski Erg", "Running", "Double Under", "Single Under"],
  "Metcon Movements": [
    "Burpee",
    "Wall Ball",
    "Box Jump",
    "Kettlebell Swing",
    "Dumbbell Snatch",
    "Thrusters (DB)",
    "Devil Press",
  ],
  Accessory: ["GHD Sit-Up", "Hip Extension", "Banded Pull-Apart", "Poliquin Step-Up", "Face Pull"],
  Mobility: ["PVC Pass-Through", "Samson Stretch", "Pigeon Stretch", "Couch Stretch"],
};

const seedExercises = async () => {
  const categories = await Promise.all(
    Object.keys(EXERCISES).map((name, i) =>
      prisma.exerciseCategory.create({ data: { name, sortOrder: i } }),
    ),
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id])) as Record<
    string,
    string
  >;

  const exerciseData: Prisma.ExerciseCreateManyInput[] = Object.entries(EXERCISES).flatMap(
    ([cat, names]) => names.map((name) => ({ name, categoryId: catMap[cat] })),
  );

  await prisma.exercise.createMany({ data: exerciseData });
  const exercises = await prisma.exercise.findMany();
  const exMap = Object.fromEntries(exercises.map((e) => [e.name, e.id])) as Record<string, string>;

  const total = Object.values(EXERCISES).reduce((sum, arr) => sum + arr.length, 0);

  console.log(`  Exercise categories: ${Object.keys(EXERCISES).length}, Exercises: ${total}`);

  return { catMap, exMap };
};

const createWorkout = async (
  planId: string,
  scheduledDate: Date | null,
  title: string,
  blocks: BlockConfig[],
  sortOrder = 0,
) => {
  const workout = await prisma.workout.create({
    data: { planId, scheduledDate, title, sortOrder, createdAt: daysAgo(30) },
  });

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]!;

    await prisma.workoutBlock.create({
      data: {
        workoutId: workout.id,
        sectionType: b.sectionType,
        scoreType: b.scoreType,
        title: b.title,
        notes: b.notes,
        categoryId: b.categoryId,
        rounds: b.rounds,
        timeCapSec: b.timeCapSec,
        intervalSec: b.intervalSec,
        workSec: b.workSec,
        restSec: b.restSec,
        restAfterSec: b.restAfterSec,
        sortOrder: bi,
        sets: {
          create: b.sets.map((s, si) => ({
            exerciseId: s.exerciseId,
            reps: s.reps,
            weightValue: s.weightValue,
            weightUnit: s.weightUnit ?? Unit.LB,
            weightType: s.weightType ?? "ABSOLUTE",
            rpe: s.rpe,
            notes: s.notes,
            sortOrder: s.sortOrder ?? si,
          })),
        },
      },
    });
  }

  return workout;
};

const seedTrainingData = async (coachProfileId: string, exMap: ExMap) => {
  const e = exMap;

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

  const p1w1 = await createWorkout(plan1.id, daysAgo(14), "Day 1: Heavy Squats + Fran", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Warm-Up", [
      ...repeat(3, e["Row"]!, undefined, undefined, { notes: "250m" }),
      ...repeat(3, e["PVC Pass-Through"]!, 10),
    ]),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Back Squat",
      wave(e["Back Squat"]!, 6, [155, 165, 175, 185, 185]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "C. Fran",
      [
        set(e["Thruster"]!, 21, 95),
        set(e["Pull-Up"]!, 21),
        set(e["Thruster"]!, 15, 95),
        set(e["Pull-Up"]!, 15),
        set(e["Thruster"]!, 9, 95),
        set(e["Pull-Up"]!, 9),
      ],
      { timeCapSec: 720 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "D. Accessory", [
      ...repeat(3, e["Poliquin Step-Up"]!, 8, 35),
      ...repeat(3, e["GHD Sit-Up"]!, 15),
    ]),
  ]);

  const p1w2 = await createWorkout(plan1.id, daysAgo(12), "Day 2: Olympic Lifting", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Warm-Up", [
      ...repeat(2, e["Samson Stretch"]!, 10),
      ...repeat(2, e["PVC Pass-Through"]!, 15),
    ]),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Clean & Jerk",
      wave(e["Clean & Jerk"]!, 2, [155, 165, 175, 185, 195]),
      { intervalSec: 180 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "C. Snatch",
      wave(e["Snatch"]!, 2, [115, 125, 135, 145, 155]),
      { intervalSec: 150 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "D. Cool-Down", [
      ...repeat(3, e["Pigeon Stretch"]!, undefined, undefined, { notes: "1 min each side" }),
    ]),
  ]);

  const p1w3 = await createWorkout(plan1.id, daysAgo(10), "Day 3: Gymnastics + Metcon", [
    block(
      SectionType.EMOM,
      ScoreType.REPS,
      "A. Gymnastics EMOM 16",
      [
        ...repeat(4, e["Bar Muscle-Up"]!, 3),
        ...repeat(4, e["Handstand Walk"]!, undefined, undefined, { notes: "50ft" }),
        ...repeat(4, e["Toes-to-Bar"]!, 8),
        ...repeat(4, e["Ring Dip"]!, 10),
      ],
      { intervalSec: 60, rounds: 16 },
    ),
    block(
      SectionType.AMRAP,
      ScoreType.ROUNDS_REPS,
      "B. Metcon",
      [
        set(e["Wall Ball"]!, 20, 20, { notes: "20 lb" }),
        set(e["Box Jump"]!, 15, undefined, { notes: "24 in" }),
        set(e["Kettlebell Swing"]!, 12, 53, { notes: "53 lb" }),
      ],
      { timeCapSec: 900, rounds: 5 },
    ),
  ]);

  const p1w4 = await createWorkout(plan1.id, daysAgo(7), "Day 4: Pressing + Engine", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Push Press",
      wave(e["Push Press"]!, 5, [115, 125, 135, 145, 155]),
      { intervalSec: 120 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Bench Press",
      wave(e["Bench Press"]!, 5, [155, 165, 175, 185, 185]),
      { intervalSec: 120 },
    ),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "C. Cardio Chipper",
      [
        set(e["Assault Bike"]!, undefined, undefined, { notes: "30 cal" }),
        set(e["Running"]!, undefined, undefined, { notes: "400m" }),
        set(e["Ski Erg"]!, undefined, undefined, { notes: "30 cal" }),
        set(e["Running"]!, undefined, undefined, { notes: "400m" }),
        set(e["Row"]!, undefined, undefined, { notes: "30 cal" }),
      ],
      { timeCapSec: 1200 },
    ),
  ]);

  const p1w5 = await createWorkout(plan1.id, daysAgo(5), "Day 5: Deadlift + DT", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Deadlift",
      wave(e["Deadlift"]!, 3, [275, 295, 315, 335, 345]),
      { intervalSec: 180 },
    ),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "B. DT",
      [
        ...repeat(5, e["Deadlift"]!, 12, 155),
        ...repeat(5, e["Power Clean"]!, 9, 155, { notes: "hang" }),
        ...repeat(5, e["Push Jerk"]!, 6, 155),
      ],
      { timeCapSec: 600, rounds: 5 },
    ),
  ]);

  const p1w6 = await createWorkout(plan1.id, daysAgo(3), "Day 6: Snatch Complex", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Warm-Up", [
      ...repeat(3, e["Couch Stretch"]!, undefined, undefined, { notes: "1 min each" }),
      ...repeat(3, e["PVC Pass-Through"]!, 15),
    ]),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Power Snatch",
      wave(e["Power Snatch"]!, 2, [115, 125, 135, 145, 155]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.TABATA,
      ScoreType.REPS,
      "C. Tabata",
      [...repeat(8, e["Assault Bike"]!, undefined, undefined, { notes: "max cal" })],
      { workSec: 20, restSec: 10, rounds: 8 },
    ),
  ]);

  const p1w7 = await createWorkout(plan1.id, daysAgo(1), "Day 7: Gymnastics Volume", [
    block(
      SectionType.EMOM,
      ScoreType.REPS,
      "A. EMOM 20",
      [
        ...repeat(5, e["Bar Muscle-Up"]!, 3),
        ...repeat(5, e["Handstand Push-Up"]!, 7),
        ...repeat(5, e["Chest-to-Bar Pull-Up"]!, 10),
        ...repeat(5, e["Pistol Squat"]!, 8, undefined, { notes: "alternating" }),
      ],
      { intervalSec: 60, rounds: 20 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "B. Accessory", [
      ...repeat(3, e["Banded Pull-Apart"]!, 20),
      ...repeat(3, e["Face Pull"]!, 15),
    ]),
  ]);

  const p1w8 = await createWorkout(plan1.id, todayAt(0), "Day 8: Squat + Sprint", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Front Squat",
      wave(e["Front Squat"]!, 3, [185, 195, 205, 215, 225]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "B. Sprint",
      [
        set(e["Burpee"]!, 10),
        set(e["Thruster"]!, 10, 135),
        set(e["Burpee"]!, 8),
        set(e["Thruster"]!, 8, 135),
        set(e["Burpee"]!, 6),
        set(e["Thruster"]!, 6, 135),
      ],
      { timeCapSec: 600 },
    ),
  ]);

  const p2w1 = await createWorkout(plan2.id, daysAgo(14), "Monday: Strength + Metcon", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Back Squat",
      wave(e["Back Squat"]!, 5, [155, 165, 175, 185, 195]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.AMRAP,
      ScoreType.ROUNDS_REPS,
      "B. AMRAP 12",
      [set(e["Wall Ball"]!, 15, 20), set(e["Double Under"]!, 50), set(e["Toes-to-Bar"]!, 10)],
      { timeCapSec: 720 },
    ),
  ]);

  const p2w2 = await createWorkout(plan2.id, daysAgo(12), "Tuesday: Conditioning", [
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "A. 5 Rounds",
      [
        ...repeat(5, e["Row"]!, undefined, undefined, { notes: "500m" }),
        ...repeat(5, e["Burpee"]!, 15),
      ],
      { timeCapSec: 1500, rounds: 5 },
    ),
  ]);

  const p2w3 = await createWorkout(plan2.id, daysAgo(10), "Wednesday: Olympic + Skill", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Power Clean",
      wave(e["Power Clean"]!, 3, [135, 145, 155, 165, 175]),
      { intervalSec: 120 },
    ),
    block(
      SectionType.EMOM,
      ScoreType.REPS,
      "B. EMOM 12",
      [
        ...repeat(4, e["Pull-Up"]!, 8),
        ...repeat(4, e["Handstand Push-Up"]!, 5),
        ...repeat(4, e["Ring Dip"]!, 8),
      ],
      { intervalSec: 60, rounds: 12 },
    ),
  ]);

  const p2w4 = await createWorkout(plan2.id, daysAgo(7), "Thursday: Midline + Metcon", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Midline", [
      ...repeat(3, e["GHD Sit-Up"]!, 20),
      ...repeat(3, e["Hip Extension"]!, 15),
    ]),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "B. Chipper",
      [
        set(e["Kettlebell Swing"]!, 50, 53),
        set(e["Box Jump"]!, 40, undefined, { notes: "24 in" }),
        set(e["Wall Ball"]!, 30, 20),
        set(e["Burpee"]!, 20),
        set(e["Pull-Up"]!, 10),
      ],
      { timeCapSec: 1200 },
    ),
  ]);

  const p2w5 = await createWorkout(plan2.id, daysAgo(5), "Friday: Deadlift + Metcon", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Deadlift",
      wave(e["Deadlift"]!, 5, [185, 205, 225, 245, 265]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.AMRAP,
      ScoreType.ROUNDS_REPS,
      "B. AMRAP 10",
      [
        set(e["Dumbbell Snatch"]!, 10, 50, { notes: "alternating" }),
        set(e["Burpee"]!, 10),
        set(e["Double Under"]!, 40),
      ],
      { timeCapSec: 600 },
    ),
  ]);

  const p2w6 = await createWorkout(plan2.id, daysAgo(3), "Saturday: Team Workout", [
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "A. Partner Helen",
      [
        set(e["Running"]!, undefined, undefined, { notes: "400m" }),
        set(e["Kettlebell Swing"]!, 21, 53),
        set(e["Pull-Up"]!, 12),
        set(e["Running"]!, undefined, undefined, { notes: "400m" }),
        set(e["Kettlebell Swing"]!, 21, 53),
        set(e["Pull-Up"]!, 12),
        set(e["Running"]!, undefined, undefined, { notes: "400m" }),
        set(e["Kettlebell Swing"]!, 21, 53),
        set(e["Pull-Up"]!, 12),
      ],
      { timeCapSec: 1200 },
    ),
  ]);

  const p2w7 = await createWorkout(plan2.id, daysAgo(1), "Monday: Squat Repeat", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Back Squat",
      wave(e["Back Squat"]!, 5, [165, 175, 185, 195, 205]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.TABATA,
      ScoreType.REPS,
      "B. Tabata Double Under",
      [...repeat(8, e["Double Under"]!, undefined, undefined, { notes: "max reps" })],
      { workSec: 20, restSec: 10, rounds: 8 },
    ),
  ]);

  const p2w8 = await createWorkout(plan2.id, todayAt(0), "Tuesday: Conditioning Day", [
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "A. Row + Bike",
      [
        set(e["Row"]!, undefined, undefined, { notes: "2000m" }),
        set(e["Assault Bike"]!, undefined, undefined, { notes: "40 cal" }),
      ],
      { timeCapSec: 1800 },
    ),
    block(
      SectionType.AMRAP,
      ScoreType.ROUNDS_REPS,
      "B. AMRAP 8",
      [set(e["Kettlebell Swing"]!, 15, 53), set(e["Double Under"]!, 50)],
      { timeCapSec: 480 },
    ),
  ]);

  const p3w1 = await createWorkout(plan3.id, daysAgo(7), "Intro: Movement Basics", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Warm-Up", [
      set(e["Running"]!, undefined, undefined, { notes: "400m jog" }),
      ...repeat(2, e["PVC Pass-Through"]!, 15),
      ...repeat(2, e["Samson Stretch"]!, 10),
    ]),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Back Squat",
      [...repeat(3, e["Back Squat"]!, 10, 65, { rpe: 5 })],
      { intervalSec: 120 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "C. Deadlift",
      [...repeat(3, e["Deadlift"]!, 8, 95, { rpe: 5 })],
      { intervalSec: 120 },
    ),
  ]);

  const p3w2 = await createWorkout(plan3.id, daysAgo(5), "Day 2: Light Metcon", [
    block(
      SectionType.AMRAP,
      ScoreType.ROUNDS_REPS,
      "A. AMRAP 10",
      [
        set(e["Burpee"]!, 8),
        set(e["Box Jump"]!, 10, undefined, { notes: "20 in" }),
        set(e["Kettlebell Swing"]!, 12, 35),
      ],
      { timeCapSec: 600 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "B. Cool-Down", [
      set(e["Pigeon Stretch"]!, undefined, undefined, { notes: "2 min each side" }),
      set(e["Couch Stretch"]!, undefined, undefined, { notes: "2 min each side" }),
    ]),
  ]);

  const p3w3 = await createWorkout(plan3.id, daysAgo(3), "Day 3: Cardio Base", [
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "A. Cardio",
      [set(e["Row"]!, undefined, undefined, { notes: "2000m at easy pace" })],
      { timeCapSec: 1800 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "B. Single Unders", [
      ...repeat(3, e["Single Under"]!, 100),
    ]),
  ]);

  const p3w4 = await createWorkout(plan3.id, todayAt(0), "Day 4: Upper Body Intro", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Bench Press",
      [...repeat(3, e["Bench Press"]!, 8, 65, { rpe: 5 })],
      { intervalSec: 90 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Push Press",
      [...repeat(3, e["Push Press"]!, 8, 55, { rpe: 5 })],
      { intervalSec: 90 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "C. Accessory", [
      ...repeat(3, e["Banded Pull-Apart"]!, 15),
      ...repeat(3, e["Face Pull"]!, 12),
    ]),
  ]);

  const p4w1 = await createWorkout(plan4.id, daysAgo(21), "Week 1: Squat Focus", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Back Squat",
      wave(e["Back Squat"]!, 8, [165, 175, 185, 195]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Front Squat",
      wave(e["Front Squat"]!, 8, [135, 145, 155]),
      { intervalSec: 120 },
    ),
  ]);

  const p4w2 = await createWorkout(plan4.id, daysAgo(14), "Week 2: Deadlift Focus", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Deadlift",
      wave(e["Deadlift"]!, 5, [225, 245, 265, 275, 285]),
      { intervalSec: 180 },
    ),
    block(SectionType.CUSTOM, ScoreType.NONE, "B. Accessory", [
      ...repeat(3, e["GHD Sit-Up"]!, 20),
      ...repeat(3, e["Hip Extension"]!, 15),
    ]),
  ]);

  const p4w3 = await createWorkout(plan4.id, daysAgo(10), "Week 3: Press Focus", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Bench Press",
      wave(e["Bench Press"]!, 5, [145, 155, 165, 175, 185]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Push Press",
      wave(e["Push Press"]!, 6, [105, 115, 125, 135]),
      { intervalSec: 120 },
    ),
  ]);

  const p4w4 = await createWorkout(plan4.id, daysAgo(5), "Week 4 Day 1: Heavy Squat", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Back Squat",
      wave(e["Back Squat"]!, 3, [205, 215, 225, 235, 245]),
      { intervalSec: 180 },
    ),
  ]);

  const p4w5 = await createWorkout(plan4.id, daysAgo(3), "Week 4 Day 2: Heavy Deadlift", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Deadlift",
      wave(e["Deadlift"]!, 3, [275, 295, 315, 335, 345]),
      { intervalSec: 180 },
    ),
  ]);

  const p4w6 = await createWorkout(plan4.id, daysAgo(2), "Week 4 Day 3: Heavy Press", [
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "A. Bench Press",
      wave(e["Bench Press"]!, 3, [175, 185, 195, 205, 205]),
      { intervalSec: 150 },
    ),
    block(
      SectionType.STRENGTH,
      ScoreType.LOAD,
      "B. Push Jerk",
      wave(e["Push Jerk"]!, 3, [155, 165, 175, 185]),
      { intervalSec: 120 },
    ),
  ]);

  const p4w7 = await createWorkout(plan4.id, daysAgo(1), "Week 4 Day 4: Accessory", [
    block(SectionType.CUSTOM, ScoreType.NONE, "A. Accessory", [
      ...repeat(4, e["GHD Sit-Up"]!, 15),
      ...repeat(4, e["Poliquin Step-Up"]!, 12, 35),
      ...repeat(4, e["Face Pull"]!, 15),
    ]),
  ]);

  await createWorkout(plan5.id, null, "Assessment: Barbell Basics", [
    block(SectionType.STRENGTH, ScoreType.LOAD, "A. Back Squat", [
      ...repeat(3, e["Back Squat"]!, 5, undefined, { notes: "Find working weight" }),
    ]),
    block(SectionType.STRENGTH, ScoreType.LOAD, "B. Deadlift", [
      ...repeat(3, e["Deadlift"]!, 5, undefined, { notes: "Find working weight" }),
    ]),
  ]);

  await createWorkout(plan5.id, null, "Assessment: Conditioning", [
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "A. 500m Row",
      [set(e["Row"]!, undefined, undefined, { notes: "500m max effort" })],
      { timeCapSec: 300 },
    ),
    block(
      SectionType.FOR_TIME,
      ScoreType.TIME,
      "B. Bike Sprint",
      [set(e["Assault Bike"]!, undefined, undefined, { notes: "15 cal max effort" })],
      { timeCapSec: 300 },
    ),
  ]);

  await createWorkout(plan5.id, null, "Assessment: Gymnastics", [
    block(SectionType.CUSTOM, ScoreType.REPS, "A. Bar Muscle-Up Test", [
      ...repeat(3, e["Bar Muscle-Up"]!, undefined, undefined, { notes: "max reps" }),
    ]),
    block(SectionType.CUSTOM, ScoreType.PASS_FAIL, "B. Handstand Walk Test", [
      ...repeat(3, e["Handstand Walk"]!, undefined, undefined, { notes: "max distance" }),
    ]),
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
      orderBy: { sortOrder: "asc" },
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
  await createLog(users.jenny.id, workouts.p1[3]!.id, daysAgo(7), false, "Scaled push press");
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
      { userId: users.sarah.id, benchmarkDefinitionId: defs[0]!.id, value: 225 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[1]!.id, value: 285 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[2]!.id, value: 185 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[3]!.id, value: 145 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[4]!.id, value: 195 },
      { userId: users.sarah.id, benchmarkDefinitionId: defs[6]!.id, value: 22 },

      { userId: users.mike.id, benchmarkDefinitionId: defs[0]!.id, value: 315 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[1]!.id, value: 405 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[2]!.id, value: 245 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[5]!.id, value: 420 },
      { userId: users.mike.id, benchmarkDefinitionId: defs[6]!.id, value: 30 },

      { userId: users.jenny.id, benchmarkDefinitionId: defs[0]!.id, value: 175 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[1]!.id, value: 225 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[4]!.id, value: 240 },
      { userId: users.jenny.id, benchmarkDefinitionId: defs[6]!.id, value: 15 },

      { userId: users.lisa.id, benchmarkDefinitionId: defs[0]!.id, value: 185 },
      { userId: users.lisa.id, benchmarkDefinitionId: defs[1]!.id, value: 245 },
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
  const { exMap } = await seedExercises();
  const { plans, workouts } = await seedTrainingData(coachProfile.id, exMap);

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
