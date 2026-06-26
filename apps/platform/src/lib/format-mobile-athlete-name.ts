import type { MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";

export const formatMobileAthleteName = (athlete: MobileAthlete): string => {
  const full = [athlete.firstName, athlete.lastName].filter(Boolean).join(" ");

  return full.length > 0 ? full : athlete.username;
};
