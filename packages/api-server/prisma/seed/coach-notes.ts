import { type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";
import { type SeededUsers } from "./users";

export const seedCoachNotes = async (
  db: PrismaClient,
  coachProfileId: string,
  users: SeededUsers,
): Promise<void> => {
  await db.coachNote.createMany({
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
