"use client";

import ArticleIcon from "@mui/icons-material/Article";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RateReviewIcon from "@mui/icons-material/RateReview";

export const quickActions = [
  {
    title: "Add Program",
    description: "Create a new training program",
    icon: <PsychologyIcon fontSize="large" />,
    href: "/programs?action=create",
    color: "primary" as const,
  },
  {
    title: "Add Review",
    description: "Add a new client review",
    icon: <RateReviewIcon fontSize="large" />,
    href: "/reviews?action=create",
    color: "primary" as const,
  },
  {
    title: "Add Blog Post",
    description: "Create a new blog article",
    icon: <ArticleIcon fontSize="large" />,
    href: "/blog?action=create",
    color: "primary" as const,
  },
  {
    title: "View New Contacts",
    description: "Check new contact submissions",
    icon: <ContactMailIcon fontSize="large" />,
    href: "/contacts?filter=new",
    color: "primary" as const,
  },
];
