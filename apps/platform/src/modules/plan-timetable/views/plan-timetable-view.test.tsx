import { fireEvent, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  type DaySlotView,
  type PlanTimetableResponse,
  type PlanTimetableView as PlanTimetableViewModel,
  TimetableSlotStatus,
  type WeekTimetableView,
} from "@repo/contracts/lms/plan-timetable";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const routerPushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

const usePlanTimetableMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    usePlanTimetable: () => usePlanTimetableMock(),
  };
});

const { PlanTimetableView } = await import("./plan-timetable-view");

const PLAN_A_ID = "clz0000000000000000plan0a";
const PLAN_B_ID = "clz0000000000000000plan0b";
const PLAN_EMPTY_ID = "clz000000000000000planemp";

const setTimetable = (response: PlanTimetableResponse): void => {
  usePlanTimetableMock.mockReturnValue({ data: response, isLoading: false, error: null });
};

const buildCard = (overrides: Partial<DaySlotView["sessions"][number]> = {}) => ({
  sessionId: "clz0000000000000000sess01",
  title: "Back Squat",
  subtitle: null,
  done: false,
  ...overrides,
});

const buildSlot = (overrides: Partial<DaySlotView>): DaySlotView => ({
  date: new Date("2026-06-15T00:00:00.000Z"),
  dayOfWeek: "MONDAY",
  dayOfMonth: 15,
  isToday: false,
  isRestDay: false,
  restLabel: null,
  status: TimetableSlotStatus.TODO,
  sessions: [],
  ...overrides,
});

const buildTodayWeek = (overrides: Partial<WeekTimetableView> = {}): WeekTimetableView => ({
  index: 0,
  startDate: new Date("2026-06-15T00:00:00.000Z"),
  days: [
    buildSlot({
      dayOfWeek: "MONDAY",
      dayOfMonth: 15,
      isToday: true,
      status: TimetableSlotStatus.TODAY,
      sessions: [buildCard({ sessionId: "clz0000000000000000todays", title: "Today Workout" })],
    }),
    buildSlot({
      date: new Date("2026-06-16T00:00:00.000Z"),
      dayOfWeek: "TUESDAY",
      dayOfMonth: 16,
      status: TimetableSlotStatus.DONE,
      sessions: [
        buildCard({ sessionId: "clz0000000000000000doness", title: "Done Workout", done: true }),
      ],
    }),
    buildSlot({
      date: new Date("2026-06-17T00:00:00.000Z"),
      dayOfWeek: "WEDNESDAY",
      dayOfMonth: 17,
      status: TimetableSlotStatus.TODO,
      sessions: [buildCard({ sessionId: "clz0000000000000000todoss", title: "Todo Workout" })],
    }),
    buildSlot({
      date: new Date("2026-06-18T00:00:00.000Z"),
      dayOfWeek: "THURSDAY",
      dayOfMonth: 18,
      isRestDay: true,
      restLabel: "Active Recovery",
      status: TimetableSlotStatus.REST,
      sessions: [],
    }),
  ],
  ...overrides,
});

const buildPlan = (overrides: Partial<PlanTimetableViewModel> = {}): PlanTimetableViewModel => ({
  planId: PLAN_A_ID,
  planTitle: "Strength Cycle",
  todayWeekIndex: 0,
  landingWeekIndex: 0,
  weeks: [buildTodayWeek()],
  ...overrides,
});

const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

afterEach(() => {
  usePlanTimetableMock.mockReset();
});

describe("PlanTimetableView", () => {
  it("renders the empty state when there are no plans (QA-021)", () => {
    setTimetable({ plans: [] });

    render(<PlanTimetableView />);

    expect(screen.getByText("No active plans")).toBeInTheDocument();
  });

  it("renders the today, done, todo and rest slots with the Today chip on the today card (QA-022)", () => {
    setTimetable({ plans: [buildPlan()] });

    render(<PlanTimetableView />);

    expect(screen.getByText("Today Workout")).toBeInTheDocument();
    expect(screen.getByText("Done Workout")).toBeInTheDocument();
    expect(screen.getByText("Todo Workout")).toBeInTheDocument();
    expect(screen.getByText("Active Recovery")).toBeInTheDocument();

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders the day-column number from dayOfMonth, not the device-local date (QA-002)", () => {
    const shiftedDate = new Date("2026-06-15T00:00:00.000Z");

    setTimetable({
      plans: [
        buildPlan({
          weeks: [
            buildTodayWeek({
              days: [
                buildSlot({
                  date: shiftedDate,
                  dayOfWeek: "MONDAY",
                  dayOfMonth: 15,
                  isToday: true,
                  status: TimetableSlotStatus.TODAY,
                  sessions: [buildCard({ title: "Today Workout" })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    render(<PlanTimetableView />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
  });

  it("hides the plan switcher when there is a single plan", () => {
    setTimetable({ plans: [buildPlan()] });

    render(<PlanTimetableView />);

    expect(screen.queryByRole("button", { name: "Strength Cycle" })).toBeNull();
  });

  it("shows the plan switcher and switches the rendered tree when there are two plans", () => {
    setTimetable({
      plans: [
        buildPlan({ planId: PLAN_A_ID, planTitle: "Strength Cycle" }),
        buildPlan({
          planId: PLAN_B_ID,
          planTitle: "Engine Block",
          weeks: [
            buildTodayWeek({
              days: [
                buildSlot({
                  dayOfWeek: "MONDAY",
                  dayOfMonth: 15,
                  isToday: true,
                  status: TimetableSlotStatus.TODAY,
                  sessions: [buildCard({ sessionId: "clz000000000000000planbs", title: "Row 5k" })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    render(<PlanTimetableView />);

    expect(screen.getByRole("button", { name: "Strength Cycle" })).toBeInTheDocument();
    expect(screen.getByText("Today Workout")).toBeInTheDocument();
    expect(screen.queryByText("Row 5k")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Engine Block" }));

    expect(screen.getByText("Row 5k")).toBeInTheDocument();
    expect(screen.queryByText("Today Workout")).toBeNull();
  });

  it("defaults the selected plan to the first non-empty plan (QA-005)", () => {
    setTimetable({
      plans: [
        buildPlan({ planId: PLAN_EMPTY_ID, planTitle: "Empty Plan", weeks: [] }),
        buildPlan({ planId: PLAN_A_ID, planTitle: "Strength Cycle" }),
      ],
    });

    render(<PlanTimetableView />);

    expect(screen.getByText("Today Workout")).toBeInTheDocument();
    expect(screen.queryByText("No sessions in this plan yet.")).toBeNull();
  });

  it("hides the Today button while viewing the today week", () => {
    setTimetable({ plans: [buildPlan()] });

    render(<PlanTimetableView />);

    expect(screen.queryByRole("button", { name: /jump to today/i })).toBeNull();
  });

  it("shows the Today button when the landing week is not the today week", () => {
    setTimetable({
      plans: [
        buildPlan({
          todayWeekIndex: 0,
          landingWeekIndex: 1,
          weeks: [
            buildTodayWeek(),
            buildTodayWeek({
              index: 1,
              startDate: new Date("2026-06-22T00:00:00.000Z"),
              days: [
                buildSlot({
                  date: new Date("2026-06-22T00:00:00.000Z"),
                  dayOfWeek: "MONDAY",
                  dayOfMonth: 22,
                  status: TimetableSlotStatus.TODO,
                  sessions: [
                    buildCard({ sessionId: "clz0000000000000week2ss", title: "Week Two" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    render(<PlanTimetableView />);

    expect(screen.getByRole("button", { name: /jump to today/i })).toBeInTheDocument();
  });
});
