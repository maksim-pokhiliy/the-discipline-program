import type { Indexes } from "./legacy-users-import-match";
import type { AppPasswordChange, MatchedBy, PlatformUser } from "./legacy-users-import-plan";
import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export type AppPasswordSubject = {
  row: NormalizedLegacyUser;
  user: PlatformUser | undefined;
  markerHash: string | null;
  matchedBy?: MatchedBy;
};

export const isAppPasswordPlatformChosen = ({
  row,
  user,
  markerHash,
}: AppPasswordSubject): boolean =>
  row.passwordHash !== null &&
  user !== undefined &&
  user.password !== null &&
  user.password !== row.passwordHash &&
  markerHash === null;

export const reconstructMatchedBy = (
  row: NormalizedLegacyUser,
  userId: string,
  indexes: Indexes,
): MatchedBy | null => {
  if (indexes.athleteIdsByLegacyId.get(row.legacyUserId)?.has(userId) === true) {
    return "link";
  }

  return indexes.userByEmail.get(row.email)?.id === userId ? "email" : null;
};

export const appPasswordChangeFor = (
  subject: AppPasswordSubject,
  indexes: Indexes,
): AppPasswordChange | null => {
  const { row, user } = subject;

  if (user === undefined || !isAppPasswordPlatformChosen(subject)) {
    return null;
  }

  return {
    legacyUserId: row.legacyUserId,
    userEmail: user.email,
    matchedBy: subject.matchedBy ?? reconstructMatchedBy(row, user.id, indexes),
    isEnabled: row.isEnabled,
  };
};
