import { describe, expect, it } from "vitest";

import {
  type DaySlotView,
  TimetableSlotStatus,
  type WeekTimetableView,
} from "@repo/contracts/lms/plan-timetable";
import { theme } from "@repo/mui";

import {
  DOT_FUTURE_ALPHA,
  DOT_PAST_ALPHA,
  DOT_W_CUR,
  DOT_W_OTHER,
} from "./plan-timetable.constants";
import {
  aheadHintLabel,
  countWeekProgress,
  formatWeekRangeCompact,
  resolveDotStyle,
} from "./timetable-presentation";

const EN_DASH = "–";

const buildSlot = (overrides: Partial<DaySlotView> = {}): DaySlotView => ({
  date: new Date("2026-06-15T00:00:00.000Z"),
  dayOfWeek: "MONDAY",
  dayOfMonth: 15,
  isToday: false,
  isRestDay: false,
  status: TimetableSlotStatus.TODO,
  sessions: [],
  ...overrides,
});

const buildCard = (done: boolean, sessionId: string) => ({
  sessionId,
  title: "Workout",
  subtitle: null,
  done,
});

const buildWeek = (days: DaySlotView[]): WeekTimetableView => ({
  index: 0,
  startDate: new Date("2026-06-15T00:00:00.000Z"),
  days,
});

describe("formatWeekRangeCompact", () => {
  it("renders a same-month range from the UTC-midnight Monday with no year (QA-001 pin)", () => {
    expect(formatWeekRangeCompact(new Date("2026-06-15T00:00:00.000Z"))).toBe(
      `Jun 15 ${EN_DASH} 21`,
    );
  });

  it("renders a cross-month range with no year", () => {
    expect(formatWeekRangeCompact(new Date("2026-06-29T00:00:00.000Z"))).toBe(
      `Jun 29 ${EN_DASH} Jul 5`,
    );
  });

  it("anchors the range on the stored calendar day rather than a tz-shifted previous day", () => {
    const label = formatWeekRangeCompact(new Date("2026-06-15T00:00:00.000Z"));

    expect(label.startsWith("Jun 15")).toBe(true);
    expect(label.startsWith("Jun 14")).toBe(false);
  });
});

describe("aheadHintLabel", () => {
  it("points at the next week when more weeks remain", () => {
    expect(aheadHintLabel(0, 4)).toBe("Week 2 ahead");
    expect(aheadHintLabel(2, 4)).toBe("Week 4 ahead");
  });

  it("returns the terminal label on the last week", () => {
    expect(aheadHintLabel(3, 4)).toBe("End of plan");
  });
});

describe("resolveDotStyle", () => {
  it("paints the current week dot with the primary color and the wide width", () => {
    const dot = resolveDotStyle({ index: 1, viewedIndex: 1, todayWeekIndex: 2 }, theme);

    expect(dot.width).toEqual(DOT_W_CUR);
    expect(dot.bg).toBe(theme.palette.primary.main);
  });

  it("paints a past week with the narrow width and a non-primary fill", () => {
    const dot = resolveDotStyle({ index: 0, viewedIndex: 2, todayWeekIndex: 2 }, theme);

    expect(dot.width).toEqual(DOT_W_OTHER);
    expect(dot.bg).not.toBe(theme.palette.primary.main);
  });

  it("paints a future week with a fill distinct from a past week", () => {
    const future = resolveDotStyle({ index: 3, viewedIndex: 1, todayWeekIndex: 2 }, theme);
    const past = resolveDotStyle({ index: 0, viewedIndex: 1, todayWeekIndex: 2 }, theme);

    expect(future.width).toEqual(DOT_W_OTHER);
    expect(future.bg).not.toBe(past.bg);
  });

  it("treats every non-current dot as future when there is no today week", () => {
    const futureFill = resolveDotStyle({ index: 3, viewedIndex: 1, todayWeekIndex: 2 }, theme).bg;
    const nullToday = resolveDotStyle({ index: 0, viewedIndex: 1, todayWeekIndex: null }, theme);

    expect(nullToday.width).toEqual(DOT_W_OTHER);
    expect(nullToday.bg).toBe(futureFill);
  });

  it("derives the past and future fills from distinct alpha magnitudes", () => {
    expect(DOT_PAST_ALPHA).not.toBe(DOT_FUTURE_ALPHA);
  });
});

describe("countWeekProgress", () => {
  it("aggregates done and total sessions across mixed slots", () => {
    const week = buildWeek([
      buildSlot({ sessions: [buildCard(true, "s1")] }),
      buildSlot({ sessions: [buildCard(false, "s2"), buildCard(true, "s3")] }),
      buildSlot({ sessions: [] }),
    ]);

    expect(countWeekProgress(week)).toEqual({ done: 2, total: 3 });
  });

  it("returns zero progress for an all-rest week", () => {
    const week = buildWeek([buildSlot({ sessions: [] }), buildSlot({ sessions: [] })]);

    expect(countWeekProgress(week)).toEqual({ done: 0, total: 0 });
  });

  it("counts a one-of-two done multi-session day as done 1 of total 2", () => {
    const week = buildWeek([
      buildSlot({ sessions: [buildCard(true, "s1"), buildCard(false, "s2")] }),
    ]);

    expect(countWeekProgress(week)).toEqual({ done: 1, total: 2 });
  });
});
