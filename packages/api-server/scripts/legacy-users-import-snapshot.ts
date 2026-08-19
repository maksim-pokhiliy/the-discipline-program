import type {
  PlatformIdentity,
  PlatformIndividualLink,
  PlatformSnapshot,
  PlatformUser,
} from "./legacy-users-import-plan";
import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export const INDIVIDUAL_CHANNEL = "INDIVIDUAL";

type IdentityRow = PlatformIdentity;

type LinkRow = { legacyUserId: number | null; athleteId: string | null };

type UserRow = {
  id: string;
  email: string;
  role: string;
  deletedAt: Date | null;
  password: string | null;
  legacyIdentity: { legacyUserId: number } | null;
};

export type ImportReader = {
  mobileLegacyIdentity: {
    findMany: (args: {
      where: { legacyUserId: { gte: number; lte: number } };
      select: Record<string, true>;
    }) => Promise<IdentityRow[]>;
  };
  mobilePublishLink: {
    findMany: (args: {
      where: { channel: string; legacyUserId: { in: number[] }; NOT: { athleteId: null } };
      select: { legacyUserId: true; athleteId: true };
    }) => Promise<LinkRow[]>;
  };
  user: {
    findMany: (args: {
      where: { OR: [{ email: { in: string[] } }, { id: { in: string[] } }] };
      select: {
        id: true;
        email: true;
        role: true;
        deletedAt: true;
        password: true;
        legacyIdentity: { select: { legacyUserId: true } };
      };
    }) => Promise<UserRow[]>;
  };
};

const IDENTITY_SELECT: Record<string, true> = {
  legacyUserId: true,
  userId: true,
  legacyRoleId: true,
  legacyPlanId: true,
  legacyLevelId: true,
  isEnabled: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  dateOfBirth: true,
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
    role: row.role,
    deletedAt: row.deletedAt,
    password: row.password,
    identityLegacyUserId: row.legacyIdentity?.legacyUserId ?? null,
  }));

export const loadPlatformSnapshot = async (
  reader: ImportReader,
  rows: readonly NormalizedLegacyUser[],
): Promise<PlatformSnapshot> => {
  const legacyIds = rows.map((row) => row.legacyUserId);

  if (legacyIds.length === 0) {
    return EMPTY_SNAPSHOT;
  }

  const identities = await reader.mobileLegacyIdentity.findMany({
    where: { legacyUserId: { gte: Math.min(...legacyIds), lte: Math.max(...legacyIds) } },
    select: IDENTITY_SELECT,
  });

  const linkRows = await reader.mobilePublishLink.findMany({
    where: {
      channel: INDIVIDUAL_CHANNEL,
      legacyUserId: { in: legacyIds },
      NOT: { athleteId: null },
    },
    select: { legacyUserId: true, athleteId: true },
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
      OR: [{ email: { in: rows.map((row) => row.email) } }, { id: { in: relatedUserIds } }],
    },
    select: {
      id: true,
      email: true,
      role: true,
      deletedAt: true,
      password: true,
      legacyIdentity: { select: { legacyUserId: true } },
    },
  });

  return { identities, individualLinks, users: toPlatformUsers(userRows) };
};
