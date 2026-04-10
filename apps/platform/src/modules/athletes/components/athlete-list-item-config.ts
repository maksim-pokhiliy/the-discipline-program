import { type HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";

export type AthleteFilters = {
  search: string;
  healthStatus: HealthStatus | null;
  planId: string | null;
  needsAttention: boolean;
};

export const sortByAttentionPriority = (athletes: CoachAthleteListItem[]): CoachAthleteListItem[] =>
  [...athletes].sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) {
      return a.needsAttention ? -1 : 1;
    }

    const aDays = a.daysSinceLastActivity ?? Infinity;
    const bDays = b.daysSinceLastActivity ?? Infinity;

    if (aDays !== bDays) {
      return bDays - aDays;
    }

    const nameA = a.name ?? a.email;
    const nameB = b.name ?? b.email;

    return nameA.localeCompare(nameB);
  });

export const filterAthletes = (
  athletes: CoachAthleteListItem[],
  filters: AthleteFilters,
): CoachAthleteListItem[] => {
  const searchLower = filters.search.toLowerCase();

  return athletes.filter((athlete) => {
    if (searchLower) {
      const matchesName = athlete.name?.toLowerCase().includes(searchLower);
      const matchesEmail = athlete.email.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesEmail) {
        return false;
      }
    }

    if (filters.healthStatus && athlete.healthStatus !== filters.healthStatus) {
      return false;
    }

    if (filters.planId && !athlete.activePlans.some((p) => p.id === filters.planId)) {
      return false;
    }

    if (filters.needsAttention && !athlete.needsAttention) {
      return false;
    }

    return true;
  });
};

export const extractUniquePlans = (
  athletes: CoachAthleteListItem[],
): { id: string; name: string }[] => {
  const planMap = new Map<string, { id: string; name: string }>();

  for (const athlete of athletes) {
    for (const plan of athlete.activePlans) {
      if (!planMap.has(plan.id)) {
        planMap.set(plan.id, plan);
      }
    }
  }

  return Array.from(planMap.values());
};
