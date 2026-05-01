import { type SectionSeed } from "./types";

export const ABOUT_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "about",
    section: "about:hero",
    data: {
      title: "Coach Denys Linetskyi",
      subtitle:
        "Wingate Institute graduate. CrossFit, Weightlifting & Adaptive CrossFit specialist.",
      buttonText: "Read My Story",
      buttonHref: "#journey",
      backgroundImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80",
    },
  },
  {
    pageSlug: "about",
    section: "about:journey",
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
    section: "about:credentials",
    data: {
      title: "Certifications",
      subtitle:
        "Internationally recognized qualifications in sport coaching, CrossFit methodology, and adaptive training.",
      items: [
        {
          title: "Wingate Sport Institute",
          description:
            "Diploma in Sport Coaching and Training from Israel's premier sports science institution. Covers exercise physiology, biomechanics, and periodization.",
        },
        {
          title: "CrossFit Level 2 Coach",
          description:
            "Advanced coaching certification focused on programming design, movement correction, and athlete development across all skill levels.",
        },
        {
          title: "Olympic Weightlifting Instructor",
          description:
            "Specialized credential in snatch, clean & jerk technique, and progressive coaching methods for competitive and recreational lifters.",
        },
        {
          title: "Adaptive CrossFit Specialist",
          description:
            "Certified to design inclusive programming for athletes with physical and cognitive disabilities. Scaling, equipment modification, and safety protocols.",
        },
        {
          title: "Sports Nutrition Coach",
          description:
            "Evidence-based nutrition planning for performance athletes. Macro programming, competition fueling strategies, and body composition management.",
        },
        {
          title: "Functional Movement Screen",
          description:
            "FMS certified for injury risk assessment and corrective exercise prescription. Integrated into every athlete onboarding and quarterly reassessment.",
        },
      ],
    },
  },
  {
    pageSlug: "about",
    section: "about:personal",
    data: {
      title: "Outside The Box",
      subtitle: "The person behind the programming — beyond the whiteboard and the stopwatch.",
      description:
        "When I am not writing training cycles or reviewing athlete videos, you will find me on a trail somewhere in the Carpathian mountains. Long runs above the treeline are my version of active recovery — and honestly, where most of my best programming ideas come from. I am a lifelong student of movement, a relentless meat griller, and a self-taught software engineer who built this entire platform from scratch. I believe coaching is a craft that gets better with obsession, not just experience. Every system in The Discipline Program exists because I was not satisfied with what was already out there.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      name: "Denys Linetskyi",
      role: "Head Coach & Founder",
    },
  },
  {
    pageSlug: "about",
    section: "about:cta",
    data: {
      title: "3... 2... 1... GO!",
      subtitle: "The clock is ticking. Your training should not be random.",
      buttonText: "Join The Program",
      buttonHref: "/storefront",
    },
  },
];
