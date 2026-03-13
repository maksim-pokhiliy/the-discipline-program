import { type ApiClient } from "@repo/api-client";
import type { CalendarWorkout } from "@repo/contracts/training-plan";

export const createCalendarAPI = (client: ApiClient) => ({
  getWeek: (weekStart: Date): Promise<CalendarWorkout[]> =>
    client.request("/api/platform/training-plans/calendar", "GET", undefined, {
      weekStart: weekStart.toISOString(),
    }),
});
