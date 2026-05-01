import { type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";

export const seedReviews = async (db: PrismaClient): Promise<void> => {
  await db.marketingReview.createMany({
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
