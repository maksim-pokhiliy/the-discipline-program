import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";

export type AthleteSegment = "all" | "attention" | "invited";
export type AthleteView = "rows" | "passport";
export type AthleteSort = "lastName" | "needs" | "recentActivity" | "boardedDesc";
export type AttentionTone = "error" | "warning";

export type AthleteFilters = {
  search: string;
  segment: AthleteSegment;
  planIds: Set<string>;
  healthStatuses: Set<string>;
};

export type PlanOption = {
  id: string;
  name: string;
  count: number;
};

export type AttentionBreakdown = {
  health: number;
  inactive: number;
  actionItems: number;
};

export const INACTIVE_DAYS_THRESHOLD = 7;

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/**
 * API dates arrive as ISO strings over HTTP even though the contract types them
 * as `Date`. Coerce defensively before any `.getTime()` call.
 */
const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const toTime = (value: Date | string | null | undefined): number => {
  const date = toDate(value);

  return date ? date.getTime() : 0;
};

export const getLastName = (name: string | null, email: string): string => {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/);

  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]) ?? source;
};

export const isInactive = (athlete: CoachAthleteListItem): boolean =>
  athlete.daysSinceLastActivity !== null && athlete.daysSinceLastActivity > INACTIVE_DAYS_THRESHOLD;

export const athleteNeedsAttention = (athlete: CoachAthleteListItem): boolean =>
  athlete.healthStatus === HealthStatus.INJURED ||
  athlete.openActionItemsCount > 0 ||
  isInactive(athlete);

export const attentionTone = (athlete: CoachAthleteListItem): AttentionTone | null => {
  if (athlete.healthStatus === HealthStatus.INJURED) {
    return "error";
  }

  if (athlete.openActionItemsCount > 0 || isInactive(athlete)) {
    return "warning";
  }

  return null;
};

export const formatLastSeenShort = (value: Date | string | null): string => {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / MS_PER_MINUTE);
  const hours = Math.round(diff / MS_PER_HOUR);
  const days = Math.round(diff / MS_PER_DAY);

  if (minutes < 60) {
    return `${Math.max(minutes, 0)}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days < 7) {
    return `${days}d`;
  }

  return `${Math.round(days / 7)}w`;
};

export const formatRelativeTime = (value: Date | string | null): string => {
  const date = toDate(value);

  if (!date) {
    return "Never";
  }

  const days = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);

  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  if (days < 30) {
    return `${Math.round(days / 7)}w ago`;
  }

  if (days < 365) {
    return `${Math.round(days / 30)}mo ago`;
  }

  return `${Math.round(days / 365)}y ago`;
};

const matchesSegment = (athlete: CoachAthleteListItem, segment: AthleteSegment): boolean => {
  if (segment === "invited") {
    return athlete.isPending;
  }

  if (athlete.isPending) {
    return false;
  }

  if (segment === "attention") {
    return athleteNeedsAttention(athlete);
  }

  return true;
};

export const filterAthletes = (
  athletes: CoachAthleteListItem[],
  filters: AthleteFilters,
): CoachAthleteListItem[] => {
  const search = filters.search.trim().toLowerCase();

  return athletes.filter((athlete) => {
    if (!matchesSegment(athlete, filters.segment)) {
      return false;
    }

    if (
      filters.planIds.size > 0 &&
      !athlete.enrollments.some((enrollment) => filters.planIds.has(enrollment.planId))
    ) {
      return false;
    }

    if (filters.healthStatuses.size > 0 && !filters.healthStatuses.has(athlete.healthStatus)) {
      return false;
    }

    if (search) {
      const matchesName = (athlete.name ?? "").toLowerCase().includes(search);
      const matchesEmail = athlete.email.toLowerCase().includes(search);

      if (!matchesName && !matchesEmail) {
        return false;
      }
    }

    return true;
  });
};

export const sortAthletes = (
  athletes: CoachAthleteListItem[],
  sort: AthleteSort,
): CoachAthleteListItem[] => {
  const byLastName = (a: CoachAthleteListItem, b: CoachAthleteListItem): number =>
    getLastName(a.name, a.email).localeCompare(getLastName(b.name, b.email));

  const sorted = [...athletes];

  switch (sort) {
    case "needs":
      return sorted.sort((a, b) => {
        const rank = (athlete: CoachAthleteListItem) => (athleteNeedsAttention(athlete) ? 0 : 1);
        const diff = rank(a) - rank(b);

        return diff !== 0 ? diff : byLastName(a, b);
      });

    case "recentActivity":
      return sorted.sort((a, b) => toTime(b.lastActivityDate) - toTime(a.lastActivityDate));

    case "boardedDesc":
      return sorted.sort((a, b) => toTime(b.enrolledSince) - toTime(a.enrolledSince));

    case "lastName":
    default:
      return sorted.sort(byLastName);
  }
};

export const extractPlanOptions = (athletes: CoachAthleteListItem[]): PlanOption[] => {
  const options = new Map<string, PlanOption>();

  for (const athlete of athletes) {
    if (athlete.isPending) {
      continue;
    }

    for (const enrollment of athlete.enrollments) {
      const existing = options.get(enrollment.planId);

      if (existing) {
        existing.count += 1;
      } else {
        options.set(enrollment.planId, {
          id: enrollment.planId,
          name: enrollment.planName,
          count: 1,
        });
      }
    }
  }

  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const attentionBreakdown = (athletes: CoachAthleteListItem[]): AttentionBreakdown => {
  const breakdown: AttentionBreakdown = { health: 0, inactive: 0, actionItems: 0 };

  for (const athlete of athletes) {
    if (athlete.healthStatus === HealthStatus.INJURED) {
      breakdown.health += 1;
    }

    if (isInactive(athlete)) {
      breakdown.inactive += 1;
    }

    if (athlete.openActionItemsCount > 0) {
      breakdown.actionItems += 1;
    }
  }

  return breakdown;
};
