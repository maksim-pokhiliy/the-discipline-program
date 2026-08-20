import type {
  PlatformIdentity,
  PlatformIndividualLink,
  PlatformSnapshot,
  PlatformUser,
} from "./legacy-users-import-plan";
import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export const INDIVIDUAL_CHANNEL = "INDIVIDUAL";

export const SOFT_DELETED_EMAIL_SUFFIX = "_deleted_";

const SOFT_DELETED_EMAIL_PATTERN = /_deleted_\d+$/;

export const demangleSoftDeletedEmail = (email: string): string =>
  email.replace(SOFT_DELETED_EMAIL_PATTERN, "");

export type LinkRow = { legacyUserId: number | null; athleteId: string | null };

export type UserRow = {
  id: string;
  email: string;
  role: string;
  deletedAt: Date | null;
  password: string | null;
  legacyIdentity: { legacyUserId: number } | null;
};

export type UserWhereClause =
  | { email: { in: string[] } }
  | { id: { in: string[] } }
  | { email: { startsWith: string } };

export type LinkWhere = {
  where: {
    channel: typeof INDIVIDUAL_CHANNEL;
    legacyUserId: { in: number[] };
    NOT: { athleteId: null };
  };
};

export type UserWhere = { where: { OR: UserWhereClause[] } };

export type ImportReader = {
  mobileLegacyIdentity: { findMany: () => Promise<PlatformIdentity[]> };
  mobilePublishLink: { findMany: (args: LinkWhere) => Promise<LinkRow[]> };
  user: { findMany: (args: UserWhere) => Promise<UserRow[]> };
};

const EMPTY_SNAPSHOT: PlatformSnapshot = { identities: [], individualLinks: [], users: [] };

const toIndividualLinks = (rows: readonly LinkRow[]): PlatformIndividualLink[] =>
  rows.flatMap((row) =>
    row.legacyUserId === null || row.athleteId === null
      ? []
      : [{ legacyUserId: row.legacyUserId, athleteId: row.athleteId }],
  );

const toPlatformUsers = (rows: readonly UserRow[]): PlatformUser[] =>
  rows.map((row) => ({
    id: row.id,
    email: row.email,
    matchEmail: demangleSoftDeletedEmail(row.email),
    role: row.role,
    deletedAt: row.deletedAt,
    password: row.password,
    identityLegacyUserId: row.legacyIdentity?.legacyUserId ?? null,
  }));

export const loadPlatformSnapshot = async (
  reader: ImportReader,
  rows: readonly NormalizedLegacyUser[],
): Promise<PlatformSnapshot> => {
  if (rows.length === 0) {
    return EMPTY_SNAPSHOT;
  }

  const legacyIds = rows.map((row) => row.legacyUserId);
  const emails = rows.map((row) => row.email);

  const identities = await reader.mobileLegacyIdentity.findMany();

  const linkRows = await reader.mobilePublishLink.findMany({
    where: {
      channel: INDIVIDUAL_CHANNEL,
      legacyUserId: { in: legacyIds },
      NOT: { athleteId: null },
    },
  });

  const individualLinks = toIndividualLinks(linkRows);
  const relatedUserIds = [
    ...new Set([
      ...identities.map((identity) => identity.userId),
      ...individualLinks.map((link) => link.athleteId),
    ]),
  ];

  const userRows = await reader.user.findMany({
    where: {
      OR: [
        { email: { in: emails } },
        { id: { in: relatedUserIds } },
        ...emails.map((email) => ({
          email: { startsWith: `${email}${SOFT_DELETED_EMAIL_SUFFIX}` },
        })),
      ],
    },
  });

  return { identities, individualLinks, users: toPlatformUsers(userRows) };
};
