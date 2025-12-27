export const PAGE_SEO = {
  home: {
    title: "The Discipline Program — Home",
    description:
      "Structured training and coaching program that helps you build consistency, strength, and endurance through discipline.",
    keywords: ["fitness", "discipline", "training program", "workout", "online coaching"],
  },

  programs: {
    title: "Programs — The Discipline Program",
    description:
      "Explore training programs tailored to your goals: strength, conditioning, fat loss, and performance.",
    keywords: ["fitness programs", "strength training", "conditioning", "workout plans"],
  },

  reviews: {
    title: "Reviews — The Discipline Program",
    description:
      "Real feedback and success stories from athletes who followed The Discipline Program.",
    keywords: ["fitness reviews", "client results", "success stories"],
  },

  about: {
    title: "About — The Discipline Program",
    description:
      "Learn the story, principles, and coaching philosophy behind The Discipline Program.",
    keywords: ["about coach", "training philosophy", "fitness coach"],
  },

  blog: {
    title: "Blog — The Discipline Program",
    description:
      "Articles on training, recovery, mindset, and discipline to improve your performance.",
    keywords: ["fitness blog", "training tips", "workout articles"],
  },

  contact: {
    title: "Contact — The Discipline Program",
    description:
      "Have questions about programs or coaching? Reach out and get a personalized answer.",
    keywords: ["contact coach", "fitness contact", "program questions"],
  },

  paymentError: {
    title: "Payment Error — The Discipline Program",
    description: "Something went wrong with your payment. Check details and try again.",
    keywords: ["payment error", "checkout issue"],
  },

  paymentSuccess: {
    title: "Payment Success — The Discipline Program",
    description: "Payment completed successfully. Check your email for all the details.",
    keywords: ["payment success", "order confirmed"],
  },
};

export type PageSeoKey = keyof typeof PAGE_SEO;
