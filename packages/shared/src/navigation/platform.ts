import { type PlatformNavigationConfig } from "../types";

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
    { label: "Home", href: "/athlete", icon: "home" },
    { label: "Profile", href: "/athlete/profile", icon: "profile" },
  ],
};
