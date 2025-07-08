export const SEO_CONFIG = {
  siteName: "The Discipline Program",
  siteUrl: "https://the-discipline-program.vercel.app",
  defaultTitle: "The Discipline Program - Transform Through Discipline | Elite CrossFit Training",
  defaultDescription:
    "Join 100+ athletes who have transformed their lives through discipline. Expert CrossFit, weightlifting & functional fitness coaching by Denis Sergeev with 15+ years experience. Start your transformation today.",
  defaultKeywords:
    "crossfit training, weightlifting coach, functional fitness, online personal trainer, denis sergeev, crossfit programs, olympic weightlifting, fitness transformation, elite training, crossfit coaching",
  twitterHandle: "@disciplineprogram",

  defaultOgImage: "/images/og-default.jpg",

  organization: {
    name: "The Discipline Program",
    url: "https://the-discipline-program.vercel.app",
    logo: "https://the-discipline-program.vercel.app/icons/logo.svg",
    foundingDate: "2024",
    founder: {
      name: "Denis Sergeev",
      jobTitle: "Elite Fitness Coach & CrossFit Trainer",
    },
    sameAs: [
      "https://t.me/the_discipline_channel",
      "https://instagram.com/denis_sergeev_coach",
      "https://t.me/denis_sergeev_coach",
    ],
  },
} as const;

export const PAGE_SEO = {
  home: {
    title: "The Discipline Program - Transform Through Discipline | Elite CrossFit Training",
    description:
      "Join 100+ athletes who have transformed their lives through discipline. Expert CrossFit, weightlifting & functional fitness coaching by Denis Sergeev with 15+ years experience. Start your transformation today.",
    keywords:
      "crossfit training, weightlifting coach, functional fitness, online personal trainer, denis sergeev, crossfit programs, olympic weightlifting, fitness transformation, elite training, crossfit coaching",
  },

  programs: {
    title: "Elite Training Programs | CrossFit, Weightlifting & Functional Fitness",
    description:
      "Professional training programs designed by Denis Sergeev: Advanced CrossFit ($19.99), Functional Bodybuilding ($14.99), Olympic Weightlifting ($24.99), Competition Prep ($49.95). Choose your transformation path.",
    keywords:
      "crossfit programs, weightlifting training, functional bodybuilding, competition prep, online fitness programs, crossfit coaching, olympic lifting, strength training",
  },

  about: {
    title: "Denis Sergeev - Elite CrossFit Coach | From Lawyer to Fitness Expert",
    description:
      "Meet Denis Sergeev: Elite fitness coach with 15+ years experience, sports university graduate (Israel), former lawyer turned CrossFit expert. Specialized in CrossFit, Olympic weightlifting & military rehabilitation.",
    keywords:
      "denis sergeev biography, crossfit trainer background, fitness coach credentials, olympic weightlifting expert, crossfit coach israel, military rehabilitation specialist",
  },

  blog: {
    title: "Fitness Blog - Science-Based Training Insights | The Discipline Program",
    description:
      "Science-based fitness insights, training tips, nutrition advice from Denis Sergeev. Latest research on CrossFit, Olympic weightlifting, functional fitness, and sports performance optimization.",
    keywords:
      "fitness blog, crossfit tips, weightlifting science, training insights, nutrition advice, sports performance, exercise physiology, fitness research",
  },

  contact: {
    title: "Contact The Discipline Program | Start Your Fitness Transformation",
    description:
      "Ready to transform your fitness? Contact Denis Sergeev and The Discipline Program team. Expert coaching, personalized programs, proven results. Get started with your transformation journey today.",
    keywords:
      "contact fitness coach, crossfit coaching inquiry, personal training consultation, fitness transformation contact, elite training programs",
  },

  paymentSuccess: {
    title: "Payment Successful | The Discipline Program",
    description: "Your payment has been processed successfully. Welcome to The Discipline Program!",
    keywords: "payment successful, fitness program access, crossfit training, denis sergeev",
  },

  paymentError: {
    title: "Payment Failed | The Discipline Program",
    description: "There was an issue processing your payment. Please try again or contact support.",
    keywords: "payment failed, payment error, support, crossfit training",
  },
} as const;
