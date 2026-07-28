import { type MobileLink } from "@repo/contracts/coaching/mobile-link";

const NEVER_PUBLISHED_ALL_LABEL = "Never published";
const NEVER_PUBLISHED_SOME_SUFFIX = " never published";
const WEEK_PENDING_ALL_LABEL = "This week not published yet";
const WEEK_PENDING_SOME_SUFFIX = " not published this week";

export type StripPublishStatus =
  | { kind: "none" }
  | {
      kind: "never-published";
      label: string;
      weekPendingLabel: string | null;
      weekPublishedAt: Date | null;
    }
  | { kind: "week-pending"; label: string; weekPublishedAt: Date | null }
  | { kind: "week-published"; weekPublishedAt: Date };

const toTime = (value: Date): number => new Date(value).getTime();

const isNeverPublished = (link: MobileLink): boolean => link.publishedDayCount === 0;

const isWeekPending = (link: MobileLink): boolean =>
  link.publishedDayCount > 0 &&
  link.weekPublish !== undefined &&
  link.weekPublish.publishedDayCount === 0;

const buildLabel = (count: number, total: number, allLabel: string, someSuffix: string): string =>
  count === total ? allLabel : `${count}${someSuffix}`;

const buildWeekPendingLabel = (count: number, total: number): string =>
  buildLabel(count, total, WEEK_PENDING_ALL_LABEL, WEEK_PENDING_SOME_SUFFIX);

const latestWeekPublishedAt = (links: MobileLink[]): Date | null => {
  let latest: Date | null = null;

  for (const link of links) {
    const publishedAt = link.weekPublish?.lastPublishedAt ?? null;

    if (publishedAt !== null && (latest === null || toTime(publishedAt) > toTime(latest))) {
      latest = publishedAt;
    }
  }

  return latest;
};

export const summarizeStripPublishStatus = (links: MobileLink[]): StripPublishStatus => {
  if (links.length === 0) {
    return { kind: "none" };
  }

  const neverPublishedCount = links.filter(isNeverPublished).length;
  const weekPendingCount = links.filter(isWeekPending).length;
  const weekPublishedAt = latestWeekPublishedAt(links);

  if (neverPublishedCount > 0) {
    const label = buildLabel(
      neverPublishedCount,
      links.length,
      NEVER_PUBLISHED_ALL_LABEL,
      NEVER_PUBLISHED_SOME_SUFFIX,
    );

    return {
      kind: "never-published",
      label,
      weekPendingLabel:
        weekPendingCount === 0 ? null : buildWeekPendingLabel(weekPendingCount, links.length),
      weekPublishedAt,
    };
  }

  if (weekPendingCount > 0) {
    return {
      kind: "week-pending",
      label: buildWeekPendingLabel(weekPendingCount, links.length),
      weekPublishedAt,
    };
  }

  if (weekPublishedAt !== null) {
    return { kind: "week-published", weekPublishedAt };
  }

  return { kind: "none" };
};
