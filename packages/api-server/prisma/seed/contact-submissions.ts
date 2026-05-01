import { type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";

export const seedContactSubmissions = async (db: PrismaClient): Promise<void> => {
  await db.marketingContactSubmission.createMany({
    data: [
      {
        name: "Oleksandr Shevchenko",
        contact: "@oleksandr_shev",
        program: "The Competitor",
        message:
          "Training for the Open. How does The Competitor track compare to competitive affiliate programming?",
        status: "NEW",
        createdAt: daysAgo(1),
      },
      {
        name: "Rachel Martinez",
        contact: "+1 555-234-5678",
        program: "Foundations GPP",
        message:
          "I have a garage gym with barbell, plates, pull-up bar, and rings. Will Foundations work for my setup?",
        status: "NEW",
        createdAt: daysAgo(2),
      },
      {
        name: "Iryna Bondarenko",
        contact: "@iryna_bond",
        program: "Masters 40+",
        message:
          "I am 52. When is the Masters 40+ program coming back? My knees need the joint-friendly approach.",
        status: "NEW",
        createdAt: daysAgo(4),
      },
      {
        name: "Mark Sullivan",
        contact: "+1 555-876-5432",
        message:
          "Do you offer annual discounts? Looking to commit for a full year of Performance RX.",
        status: "IN_PROGRESS",
        notes: "Sent annual pricing. Waiting for reply.",
        createdAt: daysAgo(5),
      },
      {
        name: "Sophie Williams",
        contact: "@sophie_fit",
        program: "Performance RX",
        message: "Signed up yesterday but the training section shows no WODs. Is this normal?",
        status: "IN_PROGRESS",
        notes: "Subscription sync issue. Escalated to dev.",
        createdAt: daysAgo(3),
      },
      {
        name: "Dmytro Koval",
        contact: "+380 67 123 4567",
        program: "Foundations GPP",
        message:
          "6 weeks into Foundations. When should I move up to Performance RX? I can do 10 pull-ups and my Fran is under 6 minutes.",
        status: "REPLIED",
        notes: "Ready for RX. Sent transition guide.",
        createdAt: daysAgo(11),
      },
      {
        name: "Christina Lee",
        contact: "@christina_lee",
        program: "Performance RX",
        message:
          "Dealing with rotator cuff tendinitis. Are there built-in substitutions for overhead work?",
        status: "REPLIED",
        notes: "Advised PT first. Sent overhead substitutions list.",
        createdAt: daysAgo(15),
      },
      {
        name: "Jason Miller",
        contact: "+1 555-999-0000",
        program: "The Competitor",
        message:
          "Hit a 20 lb PR on back squat and qualified for Quarterfinals. Just wanted to say thanks!",
        status: "CLOSED",
        notes: "Success story. Asked for review.",
        createdAt: daysAgo(18),
      },
      {
        name: "Andrii Lysenko",
        contact: "@andrii_lviv",
        message:
          "I run a CrossFit affiliate in Lviv. Interested in bulk licensing for our members.",
        status: "CLOSED",
        notes: "Not ready for affiliate licensing yet. Added to waitlist.",
        createdAt: daysAgo(14),
      },
      {
        name: "Nicole Anderson",
        contact: "@nicole_anderson",
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
