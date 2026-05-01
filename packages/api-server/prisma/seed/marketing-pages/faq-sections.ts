import { type SectionSeed } from "./types";

export const FAQ_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "faq",
    section: "faq:hero",
    data: {
      title: "Got Questions?",
      subtitle: "We've got answers.",
      buttonText: "Find Answers",
      buttonHref: "#faq-content",
      backgroundImage: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1920&q=80",
    },
  },
  {
    pageSlug: "faq",
    section: "faq:content",
    data: {
      title: "FAQ",
      subtitle: "Everything you need to know before you start.",
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
  {
    pageSlug: "faq",
    section: "faq:cta",
    data: {
      title: "Still Have Questions?",
      subtitle: "Reach out and we'll help you find the right track.",
      buttonText: "Get In Touch",
      buttonHref: "/contact",
    },
  },
];
