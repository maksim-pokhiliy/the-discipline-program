import type {
  ImportConflict,
  PlatformSnapshot,
  ReconciliationSummary,
} from "./legacy-users-import-plan";

export type ReconciliationResult = {
  summary: ReconciliationSummary;
  conflicts: ImportConflict[];
};

export const reconcileIdentityLinks = (snapshot: PlatformSnapshot): ReconciliationResult => {
  const identityUserIdByLegacyId = new Map(
    snapshot.identities.map((identity) => [identity.legacyUserId, identity.userId]),
  );
  const contradicted = new Map<number, Set<string>>();
  let linksWithIdentity = 0;

  for (const link of snapshot.individualLinks) {
    const identityUserId = identityUserIdByLegacyId.get(link.legacyUserId);

    if (identityUserId === undefined) {
      continue;
    }

    linksWithIdentity += 1;

    if (identityUserId === link.athleteId) {
      continue;
    }

    const named = contradicted.get(link.legacyUserId) ?? new Set<string>();

    named.add(link.athleteId);
    contradicted.set(link.legacyUserId, named);
  }

  const conflicts = [...contradicted.entries()].map(([legacyUserId, athleteIds]) => ({
    legacyUserId,
    reason: "link-and-identity-disagree" as const,
    detail:
      `individual publish links name ${athleteIds.size} platform user(s) the stored legacy ` +
      "identity does not; the app reads the identity, so one of the two is about the wrong person",
  }));

  return {
    summary: {
      linksChecked: snapshot.individualLinks.length,
      linksWithIdentity,
      violations: conflicts.length,
    },
    conflicts,
  };
};
