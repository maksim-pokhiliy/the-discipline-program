import { type SectionSeed } from "./types";

export const HOME_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "home",
    section: "home:hero",
    data: {
      title: "Your DISCIPLINE Dictates Your SUCCESS",
      subtitle:
        "Structured CrossFit programming from Ukraine. For athletes who train with purpose, not randomness.",
      buttonText: "Start Training",
      buttonHref: "/storefront",
      backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80",
    },
  },
  {
    pageSlug: "home",
    section: "home:whyChoose",
    data: {
      title: "Why The Discipline Program?",
      subtitle: "Random workouts give random results. We build systems.",
      features: [
        {
          id: "cmnyjvhkvfb9f44b453da",
          title: "Constantly Varied",
          description: "Periodized programming across all 10 fitness domains. No guesswork.",
          iconName: "Shuffle",
        },
        {
          id: "cmnyjvhkw565b1829a94c",
          title: "High Intensity",
          description: "Maximize power output with smart programming. Every rep has a purpose.",
          iconName: "Bolt",
        },
        {
          id: "cmnyjvhkwe6695bf030c5",
          title: "Functional Movement",
          description: "Movements that carry over to sport and life. Squat, press, pull, hinge.",
          iconName: "FitnessCenter",
        },
        {
          id: "cmnyjvhkwf2b4d3d4560c",
          title: "Expert Coaching",
          description:
            "Every session designed by CF-L2 certified coach with competition experience.",
          iconName: "School",
        },
        {
          id: "cmnyjvhkw4b6909538501",
          title: "Progress Tracking",
          description:
            "Built-in benchmarks, PR logs, and periodic testing to measure real gains over time.",
          iconName: "TrendingUp",
        },
        {
          id: "cmnyjvhkw6394691b0811",
          title: "Community Driven",
          description:
            "Train alongside athletes worldwide. Shared leaderboards, weekly challenges, and accountability.",
          iconName: "Groups",
        },
      ],
    },
  },
  {
    pageSlug: "home",
    section: "home:storefront",
    data: {
      title: "Choose Your Track",
      subtitle: "From Open preparation to daily GPP. Programming for every level.",
      buttonText: "View All Programs",
      buttonHref: "/storefront",
      freeLabel: "Free",
      cardActionLabel: "Get Started",
      modalDismissLabel: "maybe later",
      modalActionLabel: "get started",
    },
  },
  {
    pageSlug: "home",
    section: "home:reviews",
    data: {
      title: "Community Results",
      subtitle:
        "Athletes hitting PRs, qualifying for competitions, and getting stronger every day.",
    },
  },
  {
    pageSlug: "home",
    section: "home:contact",
    data: {
      title: "Join The Community",
      subtitle: "Questions about programming? We are here to help.",
      buttonText: "Get In Touch",
      buttonHref: "/contact",
    },
  },
];
