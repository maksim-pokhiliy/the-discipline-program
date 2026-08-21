import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import { classifyImport } from "./legacy-users-import-classify";
import type {
  ImportPlan,
  PlatformIdentity,
  PlatformSnapshot,
  PlatformUser,
} from "./legacy-users-import-plan";
import {
  ADDRESS_CHANGE_HEADING,
  type ReportMode,
  renderImportReport,
} from "./legacy-users-import-report";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";

const COST_12_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";
const HOSTNAME = "db.example-target.invalid";
const DSN = `${"postgresql:"}//importer:hunter2@${HOSTNAME}:5432/platform`;

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: 20,
  username: "athlete@tdp.local",
  password: GOLDEN_BCRYPT_HASH,
  user_role_id: 1,
  training_level_id: 2,
  first_name: null,
  last_name: null,
  phone_number: null,
  date_of_birth: null,
  team_id: null,
  user_plan_id: 1,
  is_enabled: true,
  ...overrides,
});

const emptySnapshot = (overrides: Partial<PlatformSnapshot> = {}): PlatformSnapshot => ({
  identities: [],
  individualLinks: [],
  users: [],
  ...overrides,
});

const identityRow = (overrides: Partial<PlatformIdentity> = {}): PlatformIdentity => ({
  legacyUserId: 20,
  userId: "user_platform",
  importedPasswordHash: null,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
  isEnabled: true,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  dateOfBirth: null,
  ...overrides,
});

const userRow = (overrides: Partial<PlatformUser> = {}): PlatformUser => ({
  id: "user_platform",
  email: "athlete@tdp.local",
  matchEmail: "athlete@tdp.local",
  role: "ATHLETE",
  deletedAt: null,
  password: null,
  identityLegacyUserId: 20,
  ...overrides,
});

const refreshing = (identity: Partial<PlatformIdentity>, user: Partial<PlatformUser>) =>
  emptySnapshot({ identities: [identityRow(identity)], users: [userRow(user)] });

const planFor = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot,
  isCredentialRestoreEnabled = false,
): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot, { isCredentialRestoreEnabled });

const render = (plan: ImportPlan, mode: ReportMode = "dry-run"): string =>
  renderImportReport(plan, mode).join("\n");

describe("renderImportReport", () => {
  it("names the mode so a dry run can never be mistaken for an apply", () => {
    expect(render(planFor([sourceRow()], emptySnapshot()))).toContain(
      "DRY RUN, nothing was written",
    );
    expect(render(planFor([sourceRow()], emptySnapshot()), "applied")).toContain("APPLIED");
  });

  it("heads a refused write as refused, never as applied", () => {
    const plan = planFor([sourceRow({ training_level_id: 9 })], emptySnapshot());
    const report = render(plan, "refused");

    expect(report.split("\n").at(0)).toBe("legacy users import — REFUSED, nothing was written");
    expect(report).not.toContain("— APPLIED");
    expect(report).toContain("REFUSED: nothing was written");
  });

  it("counts every class on one summary line, including the address changes", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: 20, athleteId: "user_linked" }],
        users: [
          {
            id: "user_linked",
            email: "new.address@platform.local",
            matchEmail: "new.address@platform.local",
            role: "ATHLETE",
            deletedAt: null,
            password: COST_12_HASH,
            identityLegacyUserId: null,
          },
        ],
      }),
    );

    expect(render(plan)).toContain(
      "create 0 · attach 1 (link 1 / address 0) · refresh 0 · mirror diffs 0 · " +
        "login-address changes 1 · credentials replaced 0 · markers backfilled 0 · " +
        "conflicts 0 · warnings 1",
    );
  });

  it("gives address changes their own heading rather than burying them in warnings", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: 20, athleteId: "user_linked" }],
        users: [
          {
            id: "user_linked",
            email: "new.address@platform.local",
            matchEmail: "new.address@platform.local",
            role: "ATHLETE",
            deletedAt: null,
            password: COST_12_HASH,
            identityLegacyUserId: null,
          },
        ],
      }),
    );
    const report = render(plan);

    expect(report).toContain(ADDRESS_CHANGE_HEADING);
    expect(report).toContain("warn this athlete");
  });

  it("omits the address-change heading when no login moves", () => {
    expect(render(planFor([sourceRow()], emptySnapshot()))).not.toContain(ADDRESS_CHANGE_HEADING);
  });

  it("lists a created row with its catalog ids and enablement", () => {
    const report = render(planFor([sourceRow({ is_enabled: false })], emptySnapshot()));

    expect(report).toContain("CREATE");
    expect(report).toContain("athlete@tdp.local");
    expect(report).toContain("role 1 plan 1 level 2");
    expect(report).toContain("disabled");
    expect(report).toContain("legacy credential");
  });

  it("says plainly when a created row carries no credential", () => {
    expect(render(planFor([sourceRow({ id: 17, username: "admin" })], emptySnapshot()))).toContain(
      "no credential",
    );
  });

  it("spells out what a refresh would change", () => {
    const plan = planFor(
      [sourceRow({ training_level_id: 4 })],
      refreshing({ importedPasswordHash: GOLDEN_BCRYPT_HASH }, { password: GOLDEN_BCRYPT_HASH }),
    );

    expect(render(plan)).toContain("legacyLevelId 2 -> 4");
  });

  it("refuses in the verdict while any conflict stands, and says how to clear it", () => {
    const report = render(planFor([sourceRow({ training_level_id: 9 })], emptySnapshot()));

    expect(report).toContain("REFUSED");
    expect(report).toContain("removing that row from the export");
    expect(report).toContain("legacy catalog id out of range");
  });

  it("tells a clean dry run how to apply without ever naming the host", () => {
    const report = render(planFor([sourceRow()], emptySnapshot()));

    expect(report).toContain("CLEAN");
    expect(report).toContain("--write --expect-host=<hostname> and the plan digest above");
    expect(report).toContain("never from this report");
  });

  it("never prints a password hash, a DSN or a hostname", () => {
    const plan = planFor(
      [
        sourceRow(),
        sourceRow({ id: 17, username: "admin" }),
        sourceRow({ id: 22, username: "third@tdp.local", team_id: 3 }),
      ],
      emptySnapshot({
        individualLinks: [{ legacyUserId: 20, athleteId: "user_linked" }],
        users: [
          {
            id: "user_linked",
            email: "new.address@platform.local",
            matchEmail: "new.address@platform.local",
            role: "COACH",
            deletedAt: null,
            password: COST_12_HASH,
            identityLegacyUserId: null,
          },
        ],
      }),
    );
    const report = render(plan);

    expect(report).toContain("third@tdp.local");
    expect(report).not.toContain(GOLDEN_BCRYPT_HASH);
    expect(report).not.toContain(COST_12_HASH);
    expect(report).not.toContain("$2a$");
    expect(report).not.toContain(DSN);
    expect(report).not.toContain(HOSTNAME);
  });

  it("labels every conflict reason and warning kind it can be handed", () => {
    const plan: ImportPlan = {
      reconciliation: { linksChecked: 0, linksWithIdentity: 0, violations: 0 },
      actions: [],
      conflicts: [
        { legacyUserId: 22, reason: "link-and-identity-disagree", detail: "d" },
        { legacyUserId: 1, reason: "username-not-an-email", detail: "d" },
        { legacyUserId: 2, reason: "override-source-mismatch", detail: "d" },
        { legacyUserId: 3, reason: "duplicate-email-in-source", detail: "d" },
        { legacyUserId: 4, reason: "duplicate-legacy-id-in-source", detail: "d" },
        { legacyUserId: 5, reason: "catalog-id-out-of-range", detail: "d" },
        { legacyUserId: 6, reason: "link-and-email-disagree", detail: "d" },
        { legacyUserId: 7, reason: "ambiguous-link", detail: "d" },
        { legacyUserId: 8, reason: "matched-user-soft-deleted", detail: "d" },
        { legacyUserId: 9, reason: "matched-user-has-other-identity", detail: "d" },
        { legacyUserId: 10, reason: "platform-user-claimed-twice", detail: "d" },
        { legacyUserId: 11, reason: "identity-user-missing", detail: "d" },
      ],
      warnings: [
        { legacyUserId: 12, kind: "login-address-changes", detail: "d" },
        { legacyUserId: 13, kind: "matched-user-is-not-an-athlete", detail: "d" },
        { legacyUserId: 14, kind: "password-left-as-is", detail: "d" },
        { legacyUserId: 15, kind: "identity-absent-from-source", detail: "d" },
        { legacyUserId: 16, kind: "identity-target-drift", detail: "d" },
        { legacyUserId: 17, kind: "synthetic-email-no-credential", detail: "d" },
        { legacyUserId: 19, kind: "matched-user-has-no-credential", detail: "d" },
        { legacyUserId: 20, kind: "credential-differs-not-restored", detail: "d" },
        { legacyUserId: 21, kind: "credential-restored", detail: "d" },
        { legacyUserId: 18, kind: "legacy-team-dropped", detail: "d" },
      ],
    };
    const report = render(plan);

    for (const legacyUserId of Array.from({ length: 22 }, (_, index) => index + 1)) {
      expect(report).toContain(`[${String(legacyUserId).padStart(6, " ")}]`);
    }

    expect(report).not.toContain("undefined");
  });

  it("counts the reconciliation the gate rests on, including how much of it was checkable", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        identities: [identityRow()],
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_platform" },
          { legacyUserId: 77, athleteId: "user_unimported" },
        ],
        users: [userRow({ password: GOLDEN_BCRYPT_HASH })],
      }),
    );

    expect(render(plan)).toContain(
      "RECONCILIATION individual links 2 · matched to a stored identity 1 · violations 0",
    );
  });

  it("prints a digest of the plan and tells the operator to pin it", () => {
    const report = render(planFor([sourceRow()], emptySnapshot()));
    const digest =
      /plan digest ([0-9a-f]{12}) — pin it on the apply with --expect-plan=([0-9a-f]{12})/.exec(
        report,
      );

    expect(digest?.[1]).toBe(digest?.[2]);
  });

  it("drops the pinning hint once the plan is applied, keeping the digest for the record", () => {
    const report = render(planFor([sourceRow()], emptySnapshot()), "applied");

    expect(report).toMatch(/plan digest [0-9a-f]{12}/);
    expect(report).not.toContain("pin it on the apply");
  });

  it("heads a stale pin as its own refusal rather than as a conflict", () => {
    const report = render(planFor([sourceRow()], emptySnapshot()), "stale-plan");

    expect(report.split("\n").at(0)).toBe(
      "legacy users import — REFUSED, the plan changed since the digest you pinned",
    );
    expect(report).toContain("REFUSED: nothing was written");
    expect(report).toContain("re-run the apply with the digest printed above");
    expect(report).not.toContain("CLEAN");
  });

  it("counts the mirrored fields that moved, which is the fidelity claim itself", () => {
    const drifted = planFor(
      [sourceRow({ training_level_id: 4 })],
      refreshing({ importedPasswordHash: GOLDEN_BCRYPT_HASH }, { password: GOLDEN_BCRYPT_HASH }),
    );
    const faithful = planFor(
      [sourceRow()],
      refreshing({ importedPasswordHash: GOLDEN_BCRYPT_HASH }, { password: GOLDEN_BCRYPT_HASH }),
    );

    expect(render(drifted)).toContain("mirror diffs 1");
    expect(render(faithful)).toContain("mirror diffs 0");
  });

  it("counts the markers it recorded this run", () => {
    const backfilling = planFor([sourceRow()], refreshing({}, { password: GOLDEN_BCRYPT_HASH }));
    const nothingToRecord = planFor(
      [sourceRow()],
      refreshing({ importedPasswordHash: GOLDEN_BCRYPT_HASH }, { password: GOLDEN_BCRYPT_HASH }),
    );

    expect(render(backfilling)).toContain("markers backfilled 1");
    expect(render(nothingToRecord)).toContain("markers backfilled 0");
  });

  it("never says a credential was replaced when it only recorded a marker", () => {
    const report = render(planFor([sourceRow()], refreshing({}, { password: GOLDEN_BCRYPT_HASH })));

    expect(report).toContain("now recorded as such");
    expect(report).not.toContain("REPLACED");
    expect(report).toContain("credentials replaced 0");
  });

  it("says REPLACED on the row whose credential it actually replaced", () => {
    const restored = planFor(
      [sourceRow()],
      refreshing(
        { importedPasswordHash: COST_12_HASH },
        { password: COST_12_HASH, identityLegacyUserId: 20 },
      ),
      true,
    );
    const report = render(restored);

    expect(report).toContain("STORED CREDENTIAL REPLACED by the export hash");
    expect(report).not.toContain("now recorded as such");
  });

  it("says the reconciliation was never assessed rather than reporting a clean nothing", () => {
    const unreadable = planFor([sourceRow({ username: "not-an-address" })], emptySnapshot());

    expect(unreadable.actions).toEqual([]);
    expect(unreadable.reconciliation).toBeNull();

    const report = render(unreadable);

    expect(report).toContain("RECONCILIATION not assessed");
    expect(report).toContain("the database was never consulted");
    expect(report).not.toContain("violations 0");
  });

  it("does not invite a pin on a plan that can only be refused", () => {
    const report = render(planFor([sourceRow({ training_level_id: 9 })], emptySnapshot()));

    expect(report).toMatch(/plan digest [0-9a-f]{12} — do not pin this one/);
    expect(report).not.toContain("pin it on the apply");
  });

  it("names a link that contradicts a stored identity", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        identities: [identityRow({ userId: "user_identity" })],
        individualLinks: [{ legacyUserId: 20, athleteId: "user_other" }],
        users: [userRow({ id: "user_identity" })],
      }),
    );
    const report = render(plan);

    expect(report).toContain("publish link and stored identity name different users");
    expect(report).toContain("violations 1");
    expect(report).toContain("REFUSED");
  });

  it("does not prescribe editing the export for a conflict the export cannot clear", () => {
    const report = render(
      planFor(
        [sourceRow()],
        emptySnapshot({
          identities: [identityRow({ userId: "user_identity" })],
          individualLinks: [{ legacyUserId: 20, athleteId: "user_other" }],
          users: [userRow({ id: "user_identity" })],
        }),
      ),
    );

    expect(report).toContain("removing the row from the export changes nothing");
    expect(report).toContain("Retarget or delete that publish link");
  });

  it("keeps the plain remedy for conflicts the export genuinely can clear", () => {
    const report = render(planFor([sourceRow({ training_level_id: 9 })], emptySnapshot()));

    expect(report).toContain("removing that row from the export and re-running");
    expect(report).not.toContain("removing the row from the export changes nothing");
  });
});
