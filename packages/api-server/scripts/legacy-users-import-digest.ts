import { contentHash, sha256Hex } from "../src/utils/hash";

import {
  type CredentialOutcome,
  type FieldChange,
  IDENTITY_MIRROR_FIELDS,
  type IdentityMirror,
  type ImportAction,
  type ImportConflict,
  type ImportPlan,
  type ImportWarning,
  renderMirrorValue,
} from "./legacy-users-import-plan";

export const PLAN_DIGEST_LENGTH = 12;

const CREDENTIAL_FINGERPRINT_LENGTH = 16;

const ABSENT = "(none)";

export type CanonicalPlan = {
  actions: readonly string[];
  conflicts: readonly string[];
  warnings: readonly string[];
};

const credentialFingerprint = (hash: string | null): string =>
  hash === null ? ABSENT : sha256Hex(hash).slice(0, CREDENTIAL_FINGERPRINT_LENGTH);

const canonicalMirror = (mirror: IdentityMirror): string =>
  IDENTITY_MIRROR_FIELDS.map((field) => `${field}=${renderMirrorValue(mirror[field])}`).join(",");

const canonicalChanges = (changes: readonly FieldChange[]): string =>
  changes.map((change) => `${change.field}:${change.from}>${change.to}`).join(",");

const canonicalOutcome = (outcome: CredentialOutcome): string => {
  if (outcome.kind === "unchanged") {
    return "unchanged";
  }

  if (outcome.kind === "marker-backfilled") {
    return `marker-backfilled:${credentialFingerprint(outcome.markerHash)}`;
  }

  if (outcome.kind === "restored") {
    return `restored:${credentialFingerprint(outcome.expectedStoredHash)}>${credentialFingerprint(outcome.nextHash)}`;
  }

  return `left-as-is:${outcome.reason}`;
};

const canonicalAction = (action: ImportAction): string => {
  const { row } = action;
  const shared = `${row.legacyUserId}|${row.email}|${row.name ?? ABSENT}|${credentialFingerprint(row.passwordHash)}|${canonicalMirror(row)}`;

  if (action.kind === "create") {
    return `create|${shared}`;
  }

  if (action.kind === "attach") {
    return `attach|${shared}|${action.userId}|${action.matchedBy}`;
  }

  return `refresh|${shared}|${action.userId}|${canonicalChanges(action.identityChanges)}|${canonicalOutcome(action.credentialOutcome)}`;
};

const canonicalConflict = (conflict: ImportConflict): string =>
  `${conflict.legacyUserId}|${conflict.reason}|${conflict.detail}`;

const canonicalWarning = (warning: ImportWarning): string =>
  `${warning.legacyUserId}|${warning.kind}|${warning.detail}`;

export const canonicalizePlan = (plan: ImportPlan): CanonicalPlan => ({
  actions: plan.actions.map(canonicalAction).sort(),
  conflicts: plan.conflicts.map(canonicalConflict).sort(),
  warnings: plan.warnings.map(canonicalWarning).sort(),
});

export const planDigest = (plan: ImportPlan): string =>
  contentHash(canonicalizePlan(plan)).slice(0, PLAN_DIGEST_LENGTH);

export class PlanDigestMismatchError extends Error {
  constructor(
    public readonly pinned: string,
    public readonly recomputed: string,
  ) {
    super(
      `refusing to write: this run builds a plan with digest ${recomputed}, not the ${pinned} ` +
        "that was pinned. Nothing was written. The database moved between the dry run and this " +
        "apply, so the plan below is not the one that was reviewed.",
    );
    this.name = "PlanDigestMismatchError";
  }
}
