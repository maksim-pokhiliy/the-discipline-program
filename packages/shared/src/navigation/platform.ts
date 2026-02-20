import { type PlatformNavigationConfig } from "../types";

export const COACH_NAVIGATION: PlatformNavigationConfig = {
  items: [
    { label: "Plans", href: "/coach/plans", icon: "plans" },
    { label: "Athletes", href: "/coach/athletes", icon: "athletes" },
    { label: "Exercises", href: "/coach/exercises", icon: "exercises" },
    { label: "Profile", href: "/coach/profile", icon: "profile" },
  ],
};
