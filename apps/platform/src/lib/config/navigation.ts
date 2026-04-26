import { type PlatformNavigationConfig } from "@repo/shared";

export const COACH_NAVIGATION: PlatformNavigationConfig = {
  items: [
    { label: "Home", href: "/coach", icon: "home" },
    { label: "Plans", href: "/coach/plans", icon: "plans" },
    { label: "Library", href: "/coach/library", icon: "library" },
    { label: "Athletes", href: "/coach/athletes", icon: "athletes" },
    { label: "Profile", href: "/coach/profile", icon: "profile" },
  ],
};

export const ATHLETE_NAVIGATION: PlatformNavigationConfig = {
  items: [
    { label: "Home", href: "/athlete", icon: "home" },
    { label: "Profile", href: "/athlete/profile", icon: "profile" },
  ],
};
