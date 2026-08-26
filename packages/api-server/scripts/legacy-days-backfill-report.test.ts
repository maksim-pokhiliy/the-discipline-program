import { describe, expect, it } from "vitest";

import type {
  BackfillAction,
  BackfillPlan,
  BackfillTarget,
  BackfillConflictReason,
  BackfillWarningKind,
} from "./legacy-days-backfill-plan";
import { type BackfillReportMode, renderBackfillReport } from "./legacy-days-backfill-report";

const HOSTNAME = "db.example-target.invalid";
const DSN = `${"postgresql:"}//filler:hunter2@${HOSTNAME}:5432/platform`;
const SECRET_EXERCISE = "Back squat 5x3 at 82.5 kg, the coach's own words";

const target = (overrides: Partial<BackfillTarget> = {}): BackfillTarget => ({
  dayId: "day_1",
  planName: "Winter Cycle",
  channel: "GENERAL",
  legacyTargetId: 2,
  scheduledDate: "2026-07-01",
  legacyRowId: 11,
  ...overrides,
});

const action = (overrides: Partial<BackfillAction> = {}): BackfillAction => ({
  kind: "fill",
  target: target(),
  content: {
    legacyRowId: 11,
    isRestDay: false,
    dailyProgram: {
      dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "A", exercises: [SECRET_EXERCISE] }] }],
    },
  },
  contentHash: "0f0f0f",
  ...overrides,
});

const planOf = (overrides: Partial<BackfillPlan> = {}): BackfillPlan => ({
  actions: [action()],
  conflicts: [],
  warnings: [],
  alreadyFilled: 0,
  ...overrides,
});

const render = (plan: BackfillPlan, mode: BackfillReportMode = "dry-run"): string =>
  renderBackfillReport(plan, mode).join("\n");

const ALL_CONFLICT_REASONS: BackfillConflictReason[] = [
  "link-missing-channel-id",
  "duplicate-legacy-row",
  "rest-day-carries-a-program",
  "training-day-carries-no-program",
  "program-body-is-not-the-wire-shape",
  "program-body-carries-fields-we-would-drop",
  "duplicate-legacy-row-id",
];

const ALL_WARNING_KINDS: BackfillWarningKind[] = ["missing-in-legacy"];

describe("renderBackfillReport", () => {
  it("counts every class on one summary line", () => {
    const report = render(
      planOf({
        actions: [action(), action({ kind: "fill-from-newer-row" })],
        warnings: [
          {
            subject: "GENERAL level 2 · 2026-07-05",
            planName: "Winter Cycle",
            kind: "missing-in-legacy",
            detail: "d",
          },
        ],
        alreadyFilled: 120,
      }),
    );

    expect(report).toContain(
      "fill 1 · fill-from-newer-row 1 · missing-in-legacy 1 · already-filled (skipped) 120 · conflicts 0",
    );
  });

  it("names each day by channel, legacy target, date and plan — never by its program", () => {
    const report = render(planOf());

    expect(report).toContain("GENERAL level 2 · 2026-07-01");
    expect(report).toContain('plan "Winter Cycle"');
    expect(report).toContain("training day");
    expect(report).not.toContain(SECRET_EXERCISE);
  });

  it("shows both row ids only when the fill moves the row id", () => {
    expect(render(planOf())).toContain("legacy row 11");
    expect(render(planOf())).not.toContain("legacy row 11 -> ");
    expect(
      render(
        planOf({
          actions: [
            action({
              kind: "fill-from-newer-row",
              content: { legacyRowId: 12, isRestDay: true, dailyProgram: null },
            }),
          ],
        }),
      ),
    ).toContain("legacy row 11 -> 12");
  });

  it("offers the digest to pin on a clean dry run and withholds it when conflicts stand", () => {
    expect(render(planOf())).toContain("pin it on the apply with --expect-plan=");
    expect(
      render(
        planOf({
          conflicts: [
            {
              subject: "general_programs #11",
              planName: null,
              reason: "duplicate-legacy-row-id",
              detail: "d",
            },
          ],
        }),
      ),
    ).toContain("do not pin this one");
  });

  it("labels every conflict reason and warning kind it can be handed", () => {
    const report = render(
      planOf({
        actions: [],
        conflicts: ALL_CONFLICT_REASONS.map((reason) => ({
          subject: "general_programs #11",
          planName: null,
          reason,
          detail: "d",
        })),
        warnings: ALL_WARNING_KINDS.map((kind) => ({
          subject: "GENERAL level 2 · 2026-07-05",
          planName: "Winter Cycle",
          kind,
          detail: "d",
        })),
      }),
    );

    expect(report).not.toContain("undefined");
  });

  it("says plainly, in each mode, whether anything was written", () => {
    expect(render(planOf(), "dry-run")).toContain("nothing was written");
    expect(render(planOf(), "applied")).toContain("APPLIED: every day above was filled");
    expect(render(planOf(), "stale-plan")).toContain("not the plan whose digest was pinned");
    expect(
      render(
        planOf({
          conflicts: [
            {
              subject: "general_programs #11",
              planName: null,
              reason: "duplicate-legacy-row-id",
              detail: "d",
            },
          ],
        }),
        "refused",
      ),
    ).toContain("Every conflict above has to be resolved first");
  });

  it("never prints a host or a DSN, because it is never handed one", () => {
    const report = render(planOf());

    expect(report).not.toContain(HOSTNAME);
    expect(report).not.toContain(DSN);
  });

  it("omits every empty section", () => {
    const report = render(planOf({ actions: [] }));

    expect(report).not.toContain("FILL");
    expect(report).not.toContain("MISSING IN LEGACY");
    expect(report).not.toContain("CONFLICTS");
  });
});
