import { afterEach, describe, expect, it, vi } from "vitest";

import { type AuditProfile, buildAuditReport } from "../../../scripts/audit-profile-selections";

import type * as GuardModule from "./profile-selections-guard";

const { classifySpy } = vi.hoisted(() => ({ classifySpy: vi.fn() }));

vi.mock("./profile-selections-guard", async (importOriginal) => {
  const actual = await importOriginal<typeof GuardModule>();

  classifySpy.mockImplementation(actual.classifyProfileSelections);

  return { ...actual, classifyProfileSelections: classifySpy };
});

const levelAxis: GuardModule.ProfileSelectionAxis = {
  id: "cprofileaxislevel0000001",
  label: "Level",
  values: ["RX", "Scaled"],
  binding: null,
};

const genderAxis: GuardModule.ProfileSelectionAxis = {
  id: "cprofileaxisgender000001",
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
};

const axes = [levelAxis, genderAxis];

const DELETED_AXIS_ID = "cdeletedaxis000000000001";

const cleanProfile: AuditProfile = {
  id: "cprofileone000000000001",
  selections: { [levelAxis.id]: "RX" },
};

const informationalProfile: AuditProfile = {
  id: "cprofiletwo000000000002",
  selections: { [levelAxis.id]: "Intermediate", [DELETED_AXIS_ID]: "Anything" },
};

const rejectedProfile: AuditProfile = {
  id: "cprofilethree0000000003",
  selections: { [genderAxis.id]: "Female" },
};

const profiles = [cleanProfile, informationalProfile, rejectedProfile];

describe("buildAuditReport", () => {
  afterEach(() => {
    classifySpy.mockClear();
  });

  it("reports one row per stored key, tagged with the guard's verdict", () => {
    const report = buildAuditReport(profiles, axes);

    expect(report.rows).toEqual([
      { profileId: cleanProfile.id, key: levelAxis.id, value: "RX", verdict: "ok" },
      {
        profileId: informationalProfile.id,
        key: levelAxis.id,
        value: "Intermediate",
        verdict: "stale",
      },
      {
        profileId: informationalProfile.id,
        key: DELETED_AXIS_ID,
        value: "Anything",
        verdict: "orphan",
      },
      { profileId: rejectedProfile.id, key: genderAxis.id, value: "Female", verdict: "bound" },
    ]);
    expect(report.totals).toEqual({ ok: 1, orphan: 1, stale: 1, bound: 1 });
  });

  it("blocks the merge only when some key resolves to the rejecting verdict", () => {
    expect(buildAuditReport(profiles, axes).hasRejectedKeys).toBe(true);
    expect(buildAuditReport([cleanProfile, informationalProfile], axes).hasRejectedKeys).toBe(
      false,
    );
  });

  it("delegates to the guard's classifier once per profile, catalogue and all", () => {
    buildAuditReport(profiles, axes);

    expect(classifySpy).toHaveBeenCalledTimes(profiles.length);
    expect(classifySpy).toHaveBeenNthCalledWith(1, cleanProfile.selections, axes);
  });

  it("re-reports whatever the guard's classifier returns, restating no rule of its own", () => {
    classifySpy.mockReturnValueOnce([
      { key: levelAxis.id, value: "RX", verdict: "bound", axis: genderAxis },
    ]);

    const report = buildAuditReport([{ id: cleanProfile.id, selections: {} }], axes);

    expect(report.rows).toEqual([
      { profileId: cleanProfile.id, key: levelAxis.id, value: "RX", verdict: "bound" },
    ]);
    expect(report.totals).toEqual({ ok: 0, orphan: 0, stale: 0, bound: 1 });
    expect(report.hasRejectedKeys).toBe(true);
  });
});
