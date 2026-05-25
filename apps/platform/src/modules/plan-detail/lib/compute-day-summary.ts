import type { SessionWithLabel } from "@repo/contracts/lms/day";

const LABEL_SEPARATOR = " · ";

const pluralizeSessionCount = (count: number): string =>
  count === 1 ? "1 session" : `${count} sessions`;

export const computeDaySummary = (sessions: SessionWithLabel[]): string => {
  if (sessions.length === 0) {
    return "";
  }

  const labelNames = sessions
    .map((session) => session.label?.name ?? null)
    .filter((name): name is string => name !== null);

  if (labelNames.length === 0) {
    return pluralizeSessionCount(sessions.length);
  }

  return labelNames.join(LABEL_SEPARATOR);
};
