import { type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";

export const seedProducts = async (db: PrismaClient): Promise<void> => {
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
      isFeatured: true,
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
    await db.product.create({
      data: { ...data, prices: { create: { amountCents, currency: "USD", interval: "MONTHLY" } } },
    });
  }

  console.log("  Products: 4 (3 active, 1 inactive) with prices");
};
