import { type PlatformNavigationConfig } from "@repo/shared";

export const COACH_NAVIGATION: PlatformNavigationConfig = {
  items: [
    { label: "Home", href: "/coach", icon: "home" },
    { label: "Plans", href: "/coach/plans", icon: "plans" },
    { label: "Athletes", href: "/coach/athletes", icon: "athletes" },
    { label: "Profile", href: "/coach/profile", icon: "profile" },
  ],
};

export const ATHLETE_NAVIGATION: PlatformNavigationConfig = {
  items: [
    { label: "Plan", href: "/athlete", icon: "plans" },
    { label: "Records", href: "/athlete/records", icon: "leaderboard" },
    { label: "Profile", href: "/athlete/profile", icon: "profile" },
  ],
};
