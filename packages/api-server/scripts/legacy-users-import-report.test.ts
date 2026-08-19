import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import { classifyImport } from "./legacy-users-import-classify";
import type { ImportPlan, PlatformSnapshot } from "./legacy-users-import-plan";
import { ADDRESS_CHANGE_HEADING, renderImportReport } from "./legacy-users-import-report";
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

const planFor = (rows: LegacySourceRow[], snapshot: PlatformSnapshot): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot);

const render = (plan: ImportPlan, mode: "dry-run" | "applied" = "dry-run"): string =>
  renderImportReport(plan, mode).join("\n");

describe("renderImportReport", () => {
  it("names the mode so a dry run can never be mistaken for an apply", () => {
    expect(render(planFor([sourceRow()], emptySnapshot()))).toContain(
      "DRY RUN, nothing was written",
    );
    expect(render(planFor([sourceRow()], emptySnapshot()), "applied")).toContain("APPLIED");
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
            role: "ATHLETE",
            deletedAt: null,
            password: COST_12_HASH,
            identityLegacyUserId: null,
          },
        ],
      }),
    );

    expect(render(plan)).toContain(
      "create 0 · attach 1 (link 1 / address 0) · refresh 0 · login-address changes 1 · conflicts 0 · warnings 1",
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
      emptySnapshot({
        identities: [
          {
            legacyUserId: 20,
            userId: "user_platform",
            legacyRoleId: 1,
            legacyPlanId: 1,
            legacyLevelId: 2,
            isEnabled: true,
            firstName: null,
            lastName: null,
            phoneNumber: null,
            dateOfBirth: null,
          },
        ],
        users: [
          {
            id: "user_platform",
            email: "athlete@tdp.local",
            role: "ATHLETE",
            deletedAt: null,
            password: GOLDEN_BCRYPT_HASH,
            identityLegacyUserId: 20,
          },
        ],
      }),
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
    expect(report).toContain("--write --expect-host=<hostname>");
    expect(report).toContain("never from this report");
  });

  it("never prints a password hash, a DSN or a hostname", () => {
    const plan = planFor(
      [sourceRow(), sourceRow({ id: 17, username: "admin" }), sourceRow({ id: 22, team_id: 3 })],
      emptySnapshot({
        individualLinks: [{ legacyUserId: 20, athleteId: "user_linked" }],
        users: [
          {
            id: "user_linked",
            email: "new.address@platform.local",
            role: "COACH",
            deletedAt: null,
            password: COST_12_HASH,
            identityLegacyUserId: null,
          },
        ],
      }),
    );
    const report = render(plan);

    expect(report).not.toContain(GOLDEN_BCRYPT_HASH);
    expect(report).not.toContain(COST_12_HASH);
    expect(report).not.toContain("$2a$");
    expect(report).not.toContain(DSN);
    expect(report).not.toContain(HOSTNAME);
  });

  it("labels every conflict reason and warning kind it can be handed", () => {
    const plan: ImportPlan = {
      actions: [],
      conflicts: [
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
        { legacyUserId: 18, kind: "legacy-team-dropped", detail: "d" },
      ],
    };
    const report = render(plan);

    for (const legacyUserId of Array.from({ length: 18 }, (_, index) => index + 1)) {
      expect(report).toContain(`[${String(legacyUserId).padStart(6, " ")}]`);
    }

    expect(report).not.toContain("undefined");
  });
});
