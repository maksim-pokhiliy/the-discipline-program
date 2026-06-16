import {
  ActionItemSeverity,
  ActionItemType,
  DayOfWeek,
  EnrollmentStatus,
  Gender,
  type PrismaClient,
  Role,
  TrainingPlanStatus,
} from "@prisma/client";

import { daysAgo } from "./_helpers";
import { type SeededUsers } from "./users";

type CoachProfileRef = { id: string };

/**
 * Roster test data for /coach/athletes: plans + multi-plan/paused enrollments,
 * performed sessions (last-activity + inactive 7d+), coach notes, open action
 * items, and pending (invited, not-signed-up) athletes.
 */
export const seedTrainingData = async (
  db: PrismaClient,
  users: SeededUsers,
  coachProfile: CoachProfileRef,
): Promise<void> => {
  const coachId = coachProfile.id;
  const coachUserId = users.coach.id;

  const [performanceRx, foundations, postInjury, competitor, wristLoad] = await Promise.all([
    db.trainingPlan.create({
      data: {
        creatorId: coachUserId,
        name: "Performance RX — Q2",
        status: TrainingPlanStatus.ACTIVE,
        createdAt: daysAgo(120),
      },
    }),
    db.trainingPlan.create({
      data: {
        creatorId: coachUserId,
        name: "Foundations GPP",
        status: TrainingPlanStatus.ACTIVE,
        createdAt: daysAgo(140),
      },
    }),
    db.trainingPlan.create({
      data: {
        creatorId: coachUserId,
        name: "Post-injury Return — UB",
        status: TrainingPlanStatus.ACTIVE,
        createdAt: daysAgo(40),
      },
    }),
    db.trainingPlan.create({
      data: {
        creatorId: coachUserId,
        name: "Competitor — Spring",
        status: TrainingPlanStatus.ACTIVE,
        createdAt: daysAgo(70),
      },
    }),
    db.trainingPlan.create({
      data: {
        creatorId: coachUserId,
        name: "Wrist-load Progression",
        status: TrainingPlanStatus.ACTIVE,
        createdAt: daysAgo(20),
      },
    }),
  ]);

  await db.planEnrollment.createMany({
    data: [
      { planId: foundations.id, athleteId: users.sarah.id, boardedAt: daysAgo(55) },
      { planId: performanceRx.id, athleteId: users.mike.id, boardedAt: daysAgo(48) },
      { planId: foundations.id, athleteId: users.jenny.id, boardedAt: daysAgo(34) },
      { planId: performanceRx.id, athleteId: users.david.id, boardedAt: daysAgo(4) },
      { planId: postInjury.id, athleteId: users.lisa.id, boardedAt: daysAgo(30) },
      {
        planId: foundations.id,
        athleteId: users.lisa.id,
        boardedAt: daysAgo(120),
        status: EnrollmentStatus.PAUSED,
      },
      { planId: performanceRx.id, athleteId: users.tom.id, boardedAt: daysAgo(2) },
      { planId: wristLoad.id, athleteId: users.alex.id, boardedAt: daysAgo(8) },
      {
        planId: performanceRx.id,
        athleteId: users.alex.id,
        boardedAt: daysAgo(40),
        status: EnrollmentStatus.PAUSED,
      },
      { planId: competitor.id, athleteId: users.nina.id, boardedAt: daysAgo(30) },
      { planId: performanceRx.id, athleteId: users.nina.id, boardedAt: daysAgo(60) },
      { planId: foundations.id, athleteId: users.nina.id, boardedAt: daysAgo(15) },
      { planId: foundations.id, athleteId: users.chris.id, boardedAt: daysAgo(1) },
      { planId: foundations.id, athleteId: users.maria.id, boardedAt: daysAgo(20) },
    ].map((enrollment) => ({ ...enrollment, enrolledById: coachUserId })),
  });

  // Minimal plan → week → day → session chain so performed sessions have a
  // session to reference (last-activity is max(completedAt) per athlete).
  const week = await db.week.create({
    data: { planId: performanceRx.id, startDate: daysAgo(14) },
  });
  const day = await db.day.create({
    data: { weekId: week.id, dayOfWeek: DayOfWeek.MONDAY },
  });
  const session = await db.session.create({
    data: { dayId: day.id, order: 1 },
  });

  const lastActivity = [
    { userId: users.sarah.id, days: 0 },
    { userId: users.mike.id, days: 1 },
    { userId: users.jenny.id, days: 2 },
    { userId: users.david.id, days: 0 },
    { userId: users.lisa.id, days: 3 },
    { userId: users.tom.id, days: 1 },
    { userId: users.alex.id, days: 10 },
    { userId: users.nina.id, days: 5 },
    { userId: users.chris.id, days: 9 },
    { userId: users.maria.id, days: 2 },
  ];

  await db.performedSession.createMany({
    data: lastActivity.map(({ userId, days }) => ({
      sessionId: session.id,
      userId,
      startedAt: daysAgo(days),
      completedAt: daysAgo(days),
    })),
  });

  await db.coachNote.createMany({
    data: [
      {
        coachId,
        athleteId: users.alex.id,
        content:
          "Right shoulder flare-up — back off pressing for 2 wk. Sub: floor press + DB rows.",
        createdAt: daysAgo(1),
      },
      {
        coachId,
        athleteId: users.alex.id,
        content: "Strong on posterior chain. Bias for pulls until cleared.",
        createdAt: daysAgo(8),
      },
      {
        coachId,
        athleteId: users.lisa.id,
        content:
          "Knee — post-op week 6. Cleared for upper-only WODs + air bike. No squat, no jumping.",
        createdAt: daysAgo(6),
      },
      {
        coachId,
        athleteId: users.mike.id,
        content: "Two weeks of inconsistent attendance — check in tomorrow.",
        createdAt: daysAgo(3),
      },
      {
        coachId,
        athleteId: users.chris.id,
        content: "No log in 9 days. Reach out before the week is lost.",
        createdAt: daysAgo(2),
      },
    ],
  });

  await db.coachActionItem.createMany({
    data: [
      {
        coachId,
        athleteId: users.alex.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Reported acute right-shoulder pain after clean & jerk. Logged 4/10 recovery.",
        createdAt: daysAgo(0),
      },
      {
        coachId,
        athleteId: users.lisa.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.WARNING,
        message: "Knee swelling post-session. Asked to scale to upper-body only for 3 days.",
        createdAt: daysAgo(0),
      },
      {
        coachId,
        athleteId: users.chris.id,
        type: ActionItemType.MISSED_WORKOUTS,
        severity: ActionItemSeverity.WARNING,
        message: "9 days without a logged session. Adherence down sharply.",
        createdAt: daysAgo(1),
      },
      {
        coachId,
        athleteId: users.maria.id,
        type: ActionItemType.MISSED_WORKOUTS,
        severity: ActionItemSeverity.INFO,
        message: "Skipped Tuesday and Wednesday sessions.",
        createdAt: daysAgo(1),
      },
    ],
  });

  // Pending = invited but not signed up yet (no password) → "Invited" segment.
  const [pendingRostyk, pendingKateryna] = await Promise.all([
    db.user.create({
      data: {
        email: "rostyk.h@email.com",
        name: "Rostyslav Halayda",
        role: Role.ATHLETE,
        timezone: "UTC",
        createdAt: daysAgo(3),
      },
    }),
    db.user.create({
      data: {
        email: "kateryna.m@email.com",
        name: "Kateryna Mazur",
        role: Role.ATHLETE,
        timezone: "UTC",
        createdAt: daysAgo(1),
      },
    }),
  ]);

  await db.athleteProfile.createMany({
    data: [
      { userId: pendingRostyk.id, gender: Gender.MALE, heightCm: 182, weightKg: 84 },
      { userId: pendingKateryna.id, gender: Gender.FEMALE, heightCm: 167, weightKg: 61 },
    ],
  });

  await db.coachAthleteAssignment.createMany({
    data: [
      { coachId, athleteId: pendingRostyk.id },
      { coachId, athleteId: pendingKateryna.id },
    ],
  });

  console.log("  Training plans: 5 ACTIVE");
  console.log("  Plan enrollments: 14 (multi-plan incl. nina on 3, + 2 paused)");
  console.log("  Performed sessions: 10 (varied last-activity, alex/chris inactive 7d+)");
  console.log("  Coach notes: 5");
  console.log("  Open action items: 4 (2 health, 2 missed)");
  console.log("  Pending invited athletes: 2");
};
